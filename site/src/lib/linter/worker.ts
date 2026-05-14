/// <reference lib="webworker" />
/**
 * Browser linter worker.
 *
 * Parses SQL with libpg-query (WASM build) and runs a set of detectors that
 * mirror the production plugin's rules. The site's purpose is to let users
 * try the plugin in their browser — the detector logic here is a parallel
 * implementation pinned to the same parser output libpg-query emits, so the
 * shape of the AST it walks matches what the published rules see. Keep the
 * README as the authoritative description of behavior; this file is a
 * faithful approximation, not the source of truth.
 */

// `libpg-query.wasm` ships as a sibling of the emscripten loader inside the
// npm package. Vite bundles the loader into this worker file, but it cannot
// follow the loader's runtime `fetch("./libpg-query.wasm")` to copy the
// binary alongside the worker bundle. We import the WASM as a `?url` asset
// so Vite emits it into the build, then redirect the loader's fetch to that
// URL.
import wasmUrl from "libpg-query/wasm/libpg-query.wasm?url";

const __origFetch = self.fetch.bind(self);
self.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const u =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : (input as Request).url;
  if (u.endsWith("libpg-query.wasm")) {
    return __origFetch(wasmUrl, init);
  }
  return __origFetch(input, init);
}) as typeof fetch;

// libpg-query has to load AFTER the fetch patch is in place. Dynamic import
// inside an async IIFE keeps the patch hoisted ahead of the loader's WASM
// fetch.
const { parse: parseSql } = await import("libpg-query");
import type {
  Diagnostic,
  EnabledRules,
  LintRequest,
  LintResponse,
  ReadyMessage,
} from "./types";

// ---------------------------------------------------------------------------
// Source mapping: libpg-query emits byte offsets, the editor wants line/col.
// ---------------------------------------------------------------------------

class SourceMap {
  private offsets: number[];
  constructor(public readonly sql: string) {
    this.offsets = [0];
    for (let i = 0; i < sql.length; i++) {
      if (sql.charCodeAt(i) === 10 /* \n */) this.offsets.push(i + 1);
    }
  }
  toLineCol(byteOffset: number): { line: number; column: number } {
    if (byteOffset < 0) return { line: 1, column: 1 };
    // libpg-query reports byte offsets; for ASCII these match character
    // offsets, which is sufficient for the inputs we surface here.
    let lo = 0;
    let hi = this.offsets.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >>> 1;
      if (this.offsets[mid] <= byteOffset) lo = mid;
      else hi = mid - 1;
    }
    return {
      line: lo + 1,
      column: byteOffset - this.offsets[lo] + 1,
    };
  }
}

// ---------------------------------------------------------------------------
// AST traversal over libpg-query's "wrapped" form, e.g.
// { stmt: { SelectStmt: { ... } }, stmt_location, stmt_len }
// Each child node is wrapped as `{ <TypeName>: <fields> }`.
// ---------------------------------------------------------------------------

interface Wrapped {
  [type: string]: any;
}
interface StmtEntry {
  stmt: Wrapped;
  stmt_location?: number;
  stmt_len?: number;
}

function unwrap(node: any): { type: string; body: any } | null {
  if (!node || typeof node !== "object") return null;
  const keys = Object.keys(node);
  if (keys.length === 0) return null;
  const type = keys[0];
  if (!type || typeof node[type] !== "object") return null;
  return { type, body: node[type] };
}

function walk(node: any, visit: (type: string, body: any) => void): void {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const c of node) walk(c, visit);
    return;
  }
  if (typeof node !== "object") return;
  const u = unwrap(node);
  if (u) {
    visit(u.type, u.body);
    for (const k of Object.keys(u.body)) {
      const v = u.body[k];
      if (v && typeof v === "object") walk(v, visit);
    }
    return;
  }
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (v && typeof v === "object") walk(v, visit);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function typeName(node: any): string | undefined {
  if (!node || typeof node !== "object") return undefined;
  const names: any[] = node.names;
  if (!Array.isArray(names) || names.length === 0) return undefined;
  // Each entry is { String: { sval: "..." } }; the unqualified name is the
  // last segment (lower segments are schema qualifiers like pg_catalog).
  const last = names[names.length - 1];
  return last?.String?.sval ?? last?.String?.str;
}

function hasTypmods(node: any): boolean {
  return Array.isArray(node?.typmods) && node.typmods.length > 0;
}

const SNAKE = /^[a-z][a-z0-9_]*$/;
function isSnakeCase(s: string): boolean {
  return SNAKE.test(s);
}

function isQuotedIdent(sql: string, byteOffset: number, name: string): boolean {
  // Heuristic: the parser tells us the identifier text but not whether it
  // was quoted. We peek at the source: if a double-quoted run of the same
  // text starts at this offset, it's quoted. Otherwise the parser folded
  // the unquoted form to lowercase.
  if (byteOffset < 0 || byteOffset >= sql.length) return false;
  if (sql[byteOffset] !== '"') return false;
  return sql.slice(byteOffset + 1, byteOffset + 1 + name.length) === name;
}

// ---------------------------------------------------------------------------
// Rule detectors
// Each returns the diagnostics it found. They share a single walk to avoid
// quadratic traversals — but written as separate functions for clarity.
// ---------------------------------------------------------------------------

const MESSAGES = {
  noSelectStar:
    "Avoid `SELECT *`; list the columns you need so the result schema does not silently change when the table does.",
  missingLimit:
    "SELECT statement should include a LIMIT clause to prevent excessive data retrieval",
  deleteWithoutWhere:
    "DELETE without WHERE will remove every row. Add a WHERE clause or use TRUNCATE explicitly.",
  updateWithoutWhere:
    "UPDATE without WHERE will rewrite every row. Add a WHERE clause.",
  dropCascade:
    "DROP TABLE ... CASCADE silently removes dependent objects. List dependents explicitly.",
  truncateCascade:
    "TRUNCATE ... CASCADE empties tables referenced by foreign keys transitively.",
  crossJoin:
    "Use `JOIN ... ON true` if you really mean a cartesian product, so the intent is explicit.",
  naturalJoin:
    "NATURAL JOIN's join columns are implicit. Use JOIN ... USING (...) or JOIN ... ON ... .",
  preferJsonb:
    "Prefer JSONB over JSON — supports GIN indexes and stores a parsed representation.",
  preferIdentity: "Prefer GENERATED ... AS IDENTITY over SERIAL/BIGSERIAL.",
  missingPrimaryKey:
    "CREATE TABLE has no PRIMARY KEY. Tables without one break logical replication and most ORMs.",
  preferText:
    "Prefer TEXT (with an optional CHECK constraint) over varchar(n).",
  preferTimestamptz:
    "Prefer TIMESTAMPTZ over TIMESTAMP — `timestamp` is timezone-naive.",
  noMoney:
    "The `money` type depends on the server's locale. Use NUMERIC plus a currency column.",
  noChar:
    "Avoid CHAR(n) — PostgreSQL pads on write and trims on read. Use TEXT.",
  noGrantPublic:
    "GRANT ... TO PUBLIC covers every current and future role. Name roles explicitly.",
  preferConcurrently:
    "Prefer CREATE INDEX CONCURRENTLY in migrations to avoid blocking writers.",
  notInSubquery:
    "NOT IN (subquery) returns no rows if the subquery yields NULL. Use NOT EXISTS.",
  snakeTable:
    "Quoted mixed-case table names force every caller to quote-match. Use snake_case.",
  snakeColumn:
    "Quoted mixed-case column names force every caller to quote-match. Use snake_case.",
  implicitJoin:
    "Implicit (comma) join — the join condition is buried in WHERE. Use JOIN ... ON ... .",
} as const;

interface Ctx {
  source: SourceMap;
  enabled: EnabledRules;
  diagnostics: Diagnostic[];
}

function report(
  ctx: Ctx,
  rule: string,
  messageId: keyof typeof MESSAGES,
  location: number | undefined,
): void {
  const sev = ctx.enabled[rule];
  if (!sev) return;
  const { line, column } =
    typeof location === "number"
      ? ctx.source.toLineCol(location)
      : { line: 1, column: 1 };
  ctx.diagnostics.push({
    ruleId: rule,
    severity: sev,
    messageId,
    message: MESSAGES[messageId],
    line,
    column,
  });
}

function lintTree(parse: any, ctx: Ctx): void {
  const stmts: StmtEntry[] = parse?.stmts ?? [];
  for (const entry of stmts) {
    const stmt = entry.stmt;
    const stmtLoc = entry.stmt_location ?? 0;
    walk(stmt, (type, body) => {
      const loc: number | undefined =
        typeof body.location === "number" ? body.location : undefined;
      const here = loc ?? stmtLoc;

      switch (type) {
        case "ResTarget": {
          // no-select-star: ResTarget.val is ColumnRef whose fields end in A_Star
          const cr = body.val?.ColumnRef;
          if (cr && Array.isArray(cr.fields)) {
            if (cr.fields.some((f: any) => "A_Star" in f)) {
              report(ctx, "no-select-star", "noSelectStar", here);
            }
          }
          break;
        }
        case "SelectStmt": {
          // require-limit
          const hasLimit =
            body.limitCount && body.limitOption !== "LIMIT_OPTION_DEFAULT";
          if (!hasLimit && (body.targetList || body.fromClause)) {
            report(ctx, "require-limit", "missingLimit", here);
          }
          // no-implicit-join: fromClause has 2+ entries that are not joins
          if (Array.isArray(body.fromClause) && body.fromClause.length > 1) {
            const allBare = body.fromClause.every(
              (e: any) => "RangeVar" in e || "RangeSubselect" in e,
            );
            if (allBare) report(ctx, "no-implicit-join", "implicitJoin", here);
          }
          break;
        }
        case "DeleteStmt": {
          if (!body.whereClause) {
            report(ctx, "require-where-in-delete", "deleteWithoutWhere", here);
          }
          break;
        }
        case "UpdateStmt": {
          if (!body.whereClause) {
            report(ctx, "require-where-in-update", "updateWithoutWhere", here);
          }
          break;
        }
        case "DropStmt": {
          if (
            body.removeType === "OBJECT_TABLE" &&
            body.behavior === "DROP_CASCADE"
          ) {
            report(ctx, "no-drop-table-cascade", "dropCascade", here);
          }
          break;
        }
        case "TruncateStmt": {
          if (body.behavior === "DROP_CASCADE") {
            report(ctx, "no-truncate-cascade", "truncateCascade", here);
          }
          break;
        }
        case "JoinExpr": {
          if (body.jointype === "JOIN_CROSS") {
            report(ctx, "no-cross-join", "crossJoin", here);
          }
          if (body.isNatural === true) {
            report(ctx, "no-natural-join", "naturalJoin", here);
          }
          break;
        }
        case "ColumnDef": {
          const t = typeName(body.typeName);
          if (!t) break;
          const lower = t.toLowerCase();
          if (lower === "json")
            report(ctx, "prefer-jsonb-over-json", "preferJsonb", here);
          if (
            [
              "smallserial",
              "serial",
              "bigserial",
              "serial2",
              "serial4",
              "serial8",
            ].includes(lower)
          )
            report(ctx, "prefer-identity-over-serial", "preferIdentity", here);
          if (lower === "varchar" && hasTypmods(body.typeName))
            report(ctx, "prefer-text-over-varchar", "preferText", here);
          if (lower === "timestamp")
            report(ctx, "prefer-timestamptz", "preferTimestamptz", here);
          if (lower === "money") report(ctx, "no-money-type", "noMoney", here);
          if (lower === "bpchar" || lower === "char")
            report(ctx, "no-char-type", "noChar", here);

          // snake-case-column-name
          if (body.colname && !isSnakeCase(body.colname)) {
            const col = body.colname as string;
            const colLoc =
              typeof body.location === "number" ? body.location : here;
            if (isQuotedIdent(ctx.source.sql, colLoc, col)) {
              report(ctx, "snake-case-column-name", "snakeColumn", colLoc);
            }
          }
          break;
        }
        case "CreateStmt": {
          // require-primary-key (skip if it's PARTITION OF)
          if (!body.partbound && !body.inhRelations?.length) {
            const tableElts: any[] = body.tableElts ?? [];
            let hasPk = false;
            for (const el of tableElts) {
              if (el.Constraint?.contype === "CONSTR_PRIMARY") hasPk = true;
              const cdef = el.ColumnDef;
              if (cdef?.constraints) {
                for (const c of cdef.constraints) {
                  if (c.Constraint?.contype === "CONSTR_PRIMARY") hasPk = true;
                }
              }
            }
            if (!hasPk && tableElts.length > 0) {
              report(ctx, "require-primary-key", "missingPrimaryKey", here);
            }
          }
          // snake-case-table-name
          const relname: string | undefined = body.relation?.relname;
          if (relname && !isSnakeCase(relname)) {
            const relLoc =
              typeof body.relation?.location === "number"
                ? body.relation.location
                : here;
            if (isQuotedIdent(ctx.source.sql, relLoc, relname)) {
              report(ctx, "snake-case-table-name", "snakeTable", relLoc);
            }
          }
          break;
        }
        case "GrantStmt": {
          if (body.is_grant !== false) {
            const grantees: any[] = body.grantees ?? [];
            const hitsPublic = grantees.some(
              (g: any) =>
                g.RoleSpec?.roletype === "ROLESPEC_PUBLIC" ||
                (g.RoleSpec?.rolename ?? "").toLowerCase() === "public",
            );
            if (hitsPublic)
              report(ctx, "no-grant-to-public", "noGrantPublic", here);
          }
          break;
        }
        case "IndexStmt": {
          if (body.concurrent !== true) {
            report(
              ctx,
              "prefer-create-index-concurrently",
              "preferConcurrently",
              here,
            );
          }
          break;
        }
        case "BoolExpr": {
          // no-not-in-subquery: `NOT IN (subq)` is parsed as
          // BoolExpr(boolop=NOT_EXPR, args=[SubLink(ANY_SUBLINK, ...)]).
          // The bare-IN form is ANY_SUBLINK without a NOT wrapper. The literal-
          // list form (`NOT IN (1, 2, 3)`) goes through ScalarArrayOpExpr and
          // is unaffected.
          if (body.boolop === "NOT_EXPR") {
            const args: any[] = body.args ?? [];
            for (const a of args) {
              if (a?.SubLink?.subLinkType === "ANY_SUBLINK") {
                report(ctx, "no-not-in-subquery", "notInSubquery", here);
                break;
              }
            }
          }
          break;
        }
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Worker message plumbing
// ---------------------------------------------------------------------------

(async () => {
  try {
    // Warm the WASM by parsing a trivial query — surfaces init errors here
    // instead of inside the first user-driven lint.
    await parseSql("SELECT 1");
    const msg: ReadyMessage = { type: "ready", ok: true };
    self.postMessage(msg);
  } catch (err) {
    const msg: ReadyMessage = {
      type: "ready",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(msg);
  }
})();

self.addEventListener("message", async (e: MessageEvent<LintRequest>) => {
  const req = e.data;
  if (req?.type !== "lint") return;

  const t0 = performance.now();
  const source = new SourceMap(req.sql);
  let parse: any = null;
  let parseError: any = null;
  try {
    parse = await parseSql(req.sql);
  } catch (err: any) {
    parseError = err;
  }
  const t1 = performance.now();

  const ctx: Ctx = { source, enabled: req.enabled, diagnostics: [] };

  if (parseError) {
    // no-syntax-error owns the parser failure. libpg-query exposes the
    // byte offset on either `sqlDetails.cursorPosition` (new SqlError) or
    // `cursorpos` (legacy). Both forms decrement to a 0-based index.
    const sev = req.enabled["no-syntax-error"];
    if (sev) {
      const raw =
        typeof parseError?.sqlDetails?.cursorPosition === "number"
          ? parseError.sqlDetails.cursorPosition - 1
          : typeof parseError?.cursorpos === "number"
            ? parseError.cursorpos - 1
            : 0;
      const { line, column } = source.toLineCol(Math.max(0, raw));
      ctx.diagnostics.push({
        ruleId: "no-syntax-error",
        severity: sev,
        messageId: "syntaxError",
        message: parseError.message ?? "PostgreSQL syntax error",
        line,
        column,
      });
    }
  } else if (parse) {
    lintTree(parse, ctx);
  }

  const t2 = performance.now();

  // Stable order: by line then column then ruleId.
  ctx.diagnostics.sort(
    (a, b) =>
      a.line - b.line ||
      a.column - b.column ||
      a.ruleId.localeCompare(b.ruleId),
  );

  const resp: LintResponse = {
    id: req.id,
    type: "lint",
    diagnostics: ctx.diagnostics,
    parseMs: t1 - t0,
    ruleMs: t2 - t1,
  };
  self.postMessage(resp);
});

export {};
