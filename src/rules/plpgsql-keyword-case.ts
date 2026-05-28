import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { PLPGSQL_RESERVED_KEYWORDS } from "../utils/pg-keywords.js";

type CaseStyle = "upper" | "lower";

const DEFAULT_CASE: CaseStyle = "upper";

// Match PL/pgSQL bodies that the parser tagged as `plpgsql`. The parser
// lower-cases the LANGUAGE clause, so we compare in lower-case here.
const PLPGSQL = "plpgsql";

// One pass identifies the spans we must NOT touch (string literals,
// comments) inside the body, then a second pass walks identifier-shaped
// runs and reports those that match a known keyword.
type SkipRange = readonly [number, number];

// Identifiers that PostgreSQL only treats as keywords inside
// `GET [STACKED] DIAGNOSTICS ... = <name>`. Everywhere else they are
// ordinary identifiers (commonly used as variable names and as
// `information_schema` column names), so we must not flag them.
const DIAGNOSTIC_ITEM_NAMES: ReadonlySet<string> = new Set([
  "row_count",
  "pg_context",
  "returned_sqlstate",
  "column_name",
  "constraint_name",
  "pg_datatype_name",
  "message_text",
  "table_name",
  "schema_name",
  "pg_exception_detail",
  "pg_exception_hint",
  "pg_exception_context",
]);

// Find every `GET [STACKED] DIAGNOSTICS ... ;` span in the body so the
// diagnostic item names inside are kept as keywords while the same
// identifiers used elsewhere (variables, IS columns) are not.
const findGetDiagnosticsRanges = (
  source: string,
  skip: SkipRange[],
): SkipRange[] => {
  const ranges: SkipRange[] = [];
  const headRe = /\bget(\s+stacked)?\s+diagnostics\b/gi;
  let m: RegExpExecArray | null;
  while ((m = headRe.exec(source)) !== null) {
    if (isInSkip(m.index, skip)) continue;
    let end = m.index + m[0].length;
    while (end < source.length) {
      if (source[end] === ";" && !isInSkip(end, skip)) break;
      end++;
    }
    ranges.push([m.index, end]);
  }
  return ranges;
};

const isInRange = (offset: number, ranges: SkipRange[]): boolean => {
  for (const [s, e] of ranges) {
    if (offset >= s && offset < e) return true;
  }
  return false;
};

const collectSkipRanges = (source: string): SkipRange[] => {
  const skip: SkipRange[] = [];
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === "'") {
      const start = i;
      i++;
      while (i < source.length) {
        if (source[i] === "'") {
          if (source[i + 1] === "'") {
            i += 2;
            continue;
          }
          i++;
          break;
        }
        i++;
      }
      skip.push([start, i]);
    } else if (c === "-" && source[i + 1] === "-") {
      const start = i;
      while (i < source.length && source[i] !== "\n") i++;
      skip.push([start, i]);
    } else if (c === "/" && source[i + 1] === "*") {
      const start = i;
      i += 2;
      while (
        i < source.length - 1 &&
        !(source[i] === "*" && source[i + 1] === "/")
      ) {
        i++;
      }
      i += 2;
      skip.push([start, Math.min(i, source.length)]);
    }
  }
  return skip;
};

const isInSkip = (offset: number, skip: SkipRange[]): boolean => {
  for (const [s, e] of skip) {
    if (offset >= s && offset < e) return true;
  }
  return false;
};

// True when the word at `start` is the right-hand side of a dotted access
// (e.g. `NEW.role`, `t.column`). We walk backward over any inline whitespace
// — `NEW . role` is also valid Postgres — and check for a single `.`. Two
// dots (`..`) are not a SQL operator so are not treated as field access.
const isFieldAccessTarget = (source: string, start: number): boolean => {
  let i = start - 1;
  while (i >= 0 && (source[i] === " " || source[i] === "\t")) i--;
  if (i < 0 || source[i] !== ".") return false;
  // `..` (range) is not a field access — only single-dot counts.
  if (i > 0 && source[i - 1] === ".") return false;
  return true;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Enforce a consistent case (upper or lower) for SQL and PL/pgSQL keywords inside PL/pgSQL function bodies",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          case: { enum: ["upper", "lower"] },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      expectedUpper:
        "PL/pgSQL keyword '{{actual}}' should be uppercase: '{{expected}}'.",
      expectedLower:
        "PL/pgSQL keyword '{{actual}}' should be lowercase: '{{expected}}'.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { case?: CaseStyle };
    const target: CaseStyle = option.case ?? DEFAULT_CASE;
    const messageId = target === "upper" ? "expectedUpper" : "expectedLower";
    const transform = (value: string) =>
      target === "upper" ? value.toUpperCase() : value.toLowerCase();

    return {
      EmbeddedCode(node: Ast.EmbeddedCode) {
        if (node.language?.toLowerCase() !== PLPGSQL) return;
        const range = node.range;
        if (!range) return;
        const source = node.source ?? "";
        const skip = collectSkipRanges(source);
        const diagnosticsRanges = findGetDiagnosticsRanges(source, skip);

        const wordRe = /[a-zA-Z_][a-zA-Z0-9_]*/g;
        let match: RegExpExecArray | null;
        while ((match = wordRe.exec(source)) !== null) {
          const word = match[0];
          const startInBody = match.index;
          if (isInSkip(startInBody, skip)) continue;
          // Field-access identifier: a word that follows `.` is the right-hand
          // side of a dotted reference (e.g. `NEW.role`, `OLD.value`,
          // `tbl.column`). Even if the word lower-cases to a PL/pgSQL
          // keyword, it can only be an identifier here, so we must not
          // case-fold it. (Regression: `prefer-keyword-case`'s previous
          // behavior corrupted `NEW.role` into `NEW.ROLE` etc.)
          if (isFieldAccessTarget(source, startInBody)) continue;
          const lower = word.toLowerCase();
          if (!PLPGSQL_RESERVED_KEYWORDS.has(lower)) continue;
          if (
            DIAGNOSTIC_ITEM_NAMES.has(lower) &&
            !isInRange(startInBody, diagnosticsRanges)
          ) {
            continue;
          }
          const expected = transform(word);
          if (word === expected) continue;
          const absStart = range[0] + startInBody;
          const absEnd = absStart + word.length;
          const startLoc = context.sourceCode.getLocFromIndex(absStart);
          const endLoc = context.sourceCode.getLocFromIndex(absEnd);
          context.report({
            loc: { start: startLoc, end: endLoc },
            messageId,
            data: { actual: word, expected },
            fix: (fixer) =>
              fixer.replaceTextRange([absStart, absEnd], expected),
          });
        }
      },
    };
  },
};

export default rule;
