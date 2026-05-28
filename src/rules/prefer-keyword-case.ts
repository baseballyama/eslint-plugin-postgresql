import type { Rule } from "eslint";

type CaseStyle = "upper" | "lower";
type TypeCaseStyle = CaseStyle | "skip";

const DEFAULT_CASE: CaseStyle = "upper";
const DEFAULT_TYPES: TypeCaseStyle = "skip";

// Node types whose `range` covers a "general identifier" position —
// a column / table / constraint name. The parser tokenizer is context-
// free, so a column literally named `trigger` or `user` gets tagged
// `Keyword`. These positions are always exempt from case-folding (#144).
//
// The set is split by how we match the position:
//
// - `GENERAL_IDENTIFIER_START_TYPES`: only the first token at
//   `range[0]` is exempt. Used for nodes whose range covers the whole
//   declaration (e.g. `CREATE TABLE foo (col1 text)` — `ColumnDef`'s
//   range covers `col1 text`; we only want to exempt `col1`, not
//   the type token).
// - `GENERAL_IDENTIFIER_RANGE_TYPES`: every token inside `range` is
//   exempt. Used for nodes that consist entirely of identifier tokens
//   (`ColumnRef` covers `NEW.role`, `RangeVar` covers `schema.tbl`).
const GENERAL_IDENTIFIER_START_TYPES: ReadonlySet<string> = new Set([
  "ColumnDef",
  "Constraint",
]);
const GENERAL_IDENTIFIER_RANGE_TYPES: ReadonlySet<string> = new Set([
  "ColumnRef",
  "RangeVar",
]);

// Node types whose `range` covers a type-name position — function
// signatures, column types, `CAST(... AS T)`, `x::T`. Tokens here can
// be either built-in type keywords (`text`, `int`, ...) or user-
// defined identifiers (`ulid`, custom enums, ...). `names` is libpg-
// query's representation; `TypeName` shows up in some forms.
const TYPE_NAME_NODE_TYPES: ReadonlySet<string> = new Set([
  "names",
  "TypeName",
]);

interface Positions {
  generalIdentifierStarts: Set<number>;
  generalIdentifierRanges: Array<[number, number]>;
  // Column-name identifiers collected by name within a scoped range.
  // `IndexElem.name` and `Constraint.keys[*].sval` hold identifier names
  // but the parser doesn't give the underlying String / IndexElem nodes
  // a per-name range — they bubble up to the enclosing IndexStmt /
  // Constraint. We resolve them in a second pass by scanning tokens
  // inside the enclosing range for a value matching the recorded name.
  scopedIdentifierNames: Array<{
    name: string;
    range: [number, number];
  }>;
  typeNameStarts: Set<number>;
}

const isStringRecord = (
  value: unknown,
): value is Record<string, unknown> & { sval: string } =>
  typeof value === "object" &&
  value !== null &&
  (value as { type?: unknown }).type === "String" &&
  typeof (value as { sval?: unknown }).sval === "string";

const collectPositions = (program: unknown): Positions => {
  const generalIdentifierStarts = new Set<number>();
  const generalIdentifierRanges: Array<[number, number]> = [];
  const scopedIdentifierNames: Positions["scopedIdentifierNames"] = [];
  const typeNameStarts = new Set<number>();
  const visited = new WeakSet<object>();

  const addScopedNamesFromStringArray = (
    arr: unknown,
    range: [number, number],
  ): void => {
    if (!Array.isArray(arr)) return;
    for (const item of arr) {
      if (isStringRecord(item)) {
        scopedIdentifierNames.push({ name: item.sval, range });
      }
    }
  };

  // `Constraint.keys` / `pk_attrs` / `fk_attrs` and `IndexElem.name`
  // refer to columns whose tokens live OUTSIDE the enclosing
  // Constraint / IndexStmt range (the parser bubbles the Constraint
  // range up to cover only the `CONSTRAINT <name>` header, not the
  // `(<columns>)` body — pg_query_node ranges follow the underlying
  // libpg-query `location` which is the constraint name's position).
  // We therefore scope the column-name lookup to the enclosing
  // top-level statement, which always has a reliable range.
  const visit = (
    node: unknown,
    parentType: string | null,
    stmtRange: [number, number] | null,
  ): void => {
    if (!node || typeof node !== "object") return;
    if (visited.has(node)) return;
    visited.add(node);
    if (Array.isArray(node)) {
      for (const item of node) visit(item, parentType, stmtRange);
      return;
    }
    const obj = node as Record<string, unknown>;
    const type = obj["type"];

    let nextStmtRange: [number, number] | null = stmtRange;
    if (typeof type === "string") {
      const range = obj["range"];
      if (
        Array.isArray(range) &&
        typeof range[0] === "number" &&
        typeof range[1] === "number"
      ) {
        const start = range[0];
        const end = range[1];
        const scoped: [number, number] = [start, end];
        // The first descendant with a range that *isn't* a `Stmt`-
        // wrapper itself acts as the scope for nested column-name
        // lookups. In practice the top-level statement (`SelectStmt`,
        // `AlterTableStmt`, `CreateStmt`, …) is the first node with a
        // reliable range, and its range covers the whole statement
        // including any `(<columns>)` body.
        if (stmtRange === null && parentType === "Program") {
          nextStmtRange = scoped;
        }
        if (GENERAL_IDENTIFIER_START_TYPES.has(type)) {
          generalIdentifierStarts.add(start);
        } else if (GENERAL_IDENTIFIER_RANGE_TYPES.has(type)) {
          generalIdentifierRanges.push(scoped);
        } else if (TYPE_NAME_NODE_TYPES.has(type)) {
          typeNameStarts.add(start);
        } else if (type === "String" && parentType !== "A_Const") {
          // A bare `String` AST node represents an identifier reference
          // (column / language name / function arg name / …). Exclude
          // the case where the parent is `A_Const`, which wraps the
          // String for SQL string literals — those tokens are typed
          // `String` rather than `Keyword` and never reach this rule
          // anyway. Range-contains so the token at exactly this span
          // is exempt.
          generalIdentifierRanges.push(scoped);
        } else if (type === "ResTarget" && obj["val"] == null) {
          // `ResTarget` with no `val` is an INSERT / UPDATE column-list
          // entry (`INSERT INTO foo (col1, col2)` — each `col*` is a
          // bare `ResTarget`). The range covers exactly the identifier
          // token, so we exempt every token inside it. SELECT/RETURNING
          // targets have a `val` expression and stay subject to the
          // rule (so `AS` / `CASE` / etc. keep being case-folded).
          generalIdentifierRanges.push(scoped);
        } else if (type === "IndexElem") {
          // `IndexElem.name` is the column-reference identifier in
          // `CREATE INDEX ... (date DESC, role)`. We don't get a per-
          // identifier range, but we do know the enclosing statement
          // range — record the name + scope so the second pass can
          // resolve the token by value-match.
          const name = obj["name"];
          if (typeof name === "string" && stmtRange !== null) {
            scopedIdentifierNames.push({ name, range: stmtRange });
          }
        } else if (type === "Constraint") {
          // `Constraint.keys` / `pk_attrs` / `fk_attrs` are String[]
          // representing column identifiers (`PRIMARY KEY (a, b)`,
          // `UNIQUE (date)`, `FOREIGN KEY (x) REFERENCES t (y)`). The
          // nested String nodes don't get per-name ranges so we record
          // the names scoped to the enclosing statement range.
          if (stmtRange !== null) {
            addScopedNamesFromStringArray(obj["keys"], stmtRange);
            addScopedNamesFromStringArray(obj["pk_attrs"], stmtRange);
            addScopedNamesFromStringArray(obj["fk_attrs"], stmtRange);
          }
        }
      }
    }
    const currentType = typeof type === "string" ? type : parentType;
    for (const [key, value] of Object.entries(obj)) {
      if (key === "parent" || key === "range" || key === "loc") continue;
      visit(value, currentType, nextStmtRange);
    }
  };
  visit(program, "Program", null);
  return {
    generalIdentifierStarts,
    generalIdentifierRanges,
    scopedIdentifierNames,
    typeNameStarts,
  };
};

const isInRange = (
  position: number,
  end: number,
  ranges: ReadonlyArray<readonly [number, number]>,
): boolean => {
  for (const [s, e] of ranges) {
    if (position >= s && end <= e) return true;
  }
  return false;
};

const transformer =
  (style: CaseStyle) =>
  (value: string): string =>
    style === "upper" ? value.toUpperCase() : value.toLowerCase();

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Enforce a consistent case (upper or lower) for SQL keywords",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          case: { enum: ["upper", "lower"] },
          types: { enum: ["upper", "lower", "skip"] },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      expectedUpper:
        "SQL keyword '{{actual}}' should be uppercase: '{{expected}}'.",
      expectedLower:
        "SQL keyword '{{actual}}' should be lowercase: '{{expected}}'.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as {
      case?: CaseStyle;
      types?: TypeCaseStyle;
    };
    const target: CaseStyle = option.case ?? DEFAULT_CASE;
    const typesMode: TypeCaseStyle = option.types ?? DEFAULT_TYPES;
    const transformGeneral = transformer(target);
    const transformType = typesMode === "skip" ? null : transformer(typesMode);

    return {
      Program(node) {
        const tokens = context.sourceCode.ast.tokens ?? [];
        const {
          generalIdentifierStarts,
          generalIdentifierRanges,
          scopedIdentifierNames,
          typeNameStarts,
        } = collectPositions(node);

        // Resolve `IndexElem.name` / `Constraint.keys[*].sval` into
        // concrete token positions: for each (name, enclosing range),
        // every Keyword token in `range` whose value lower-cases to
        // `name` is an identifier mis-tagged as keyword.
        const scopedIdentifierTokenStarts = new Set<number>();
        if (scopedIdentifierNames.length > 0) {
          for (const token of tokens) {
            if (token.type !== "Keyword") continue;
            const tokValue = token.value.toLowerCase();
            for (const entry of scopedIdentifierNames) {
              if (entry.name !== tokValue) continue;
              const [s, e] = entry.range;
              if (token.range[0] >= s && token.range[1] <= e) {
                scopedIdentifierTokenStarts.add(token.range[0]);
                break;
              }
            }
          }
        }

        // Field-access guard: when a Keyword token is the right-hand
        // side of a dotted reference (`kv.key`, `NEW.role`, `t.date`),
        // PostgreSQL parses the whole expression as a `ColumnRef` whose
        // `range` only covers the first dotted segment — the trailing
        // fields fall outside any AST-derived identifier range. Walk
        // the tokens in order and flag any Keyword whose previous
        // non-trivial token is `.` as an identifier.
        const fieldAccessTokenStarts = new Set<number>();
        for (let i = 1; i < tokens.length; i++) {
          const token = tokens[i]!;
          if (token.type !== "Keyword") continue;
          const prev = tokens[i - 1]!;
          if (
            prev.type === "Punctuator" &&
            prev.value === "." &&
            // `..` is not a SQL operator — only single-dot counts.
            (i < 2 ||
              tokens[i - 2]!.type !== "Punctuator" ||
              tokens[i - 2]!.value !== ".")
          ) {
            fieldAccessTokenStarts.add(token.range[0]);
          }
        }

        for (const token of tokens) {
          if (token.type !== "Keyword") continue;
          if (generalIdentifierStarts.has(token.range[0])) continue;
          if (
            isInRange(token.range[0], token.range[1], generalIdentifierRanges)
          ) {
            continue;
          }
          if (scopedIdentifierTokenStarts.has(token.range[0])) continue;
          if (fieldAccessTokenStarts.has(token.range[0])) continue;

          let desired: string;
          let messageId: "expectedUpper" | "expectedLower";
          if (typeNameStarts.has(token.range[0])) {
            // Type-name positions get cased only when the user explicitly
            // opts in via `types`. Default `skip` leaves them alone, so
            // `text` next to a user-defined `ulid` doesn't end up
            // uppercased into a mixed-case arg list (#145).
            if (transformType === null) continue;
            desired = transformType(token.value);
            messageId =
              typesMode === "upper" ? "expectedUpper" : "expectedLower";
          } else {
            desired = transformGeneral(token.value);
            messageId = target === "upper" ? "expectedUpper" : "expectedLower";
          }
          if (token.value === desired) continue;
          context.report({
            loc: token.loc,
            messageId,
            data: { actual: token.value, expected: desired },
            fix: (fixer) => fixer.replaceTextRange(token.range, desired),
          });
        }
      },
    };
  },
};

export default rule;
