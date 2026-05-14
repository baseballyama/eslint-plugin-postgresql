import type { Rule } from "eslint";

type CaseStyle = "upper" | "lower";

const DEFAULT_CASE: CaseStyle = "upper";

// Node `type`s whose `range` covers a position the rule must NOT
// uppercase. The parser's tokenizer is context-free, so:
//
// - identifier positions (a column / table / constraint name) get
//   tagged `Keyword` whenever the spelling collides with a SQL keyword
//   (`trigger`, `user`, `order`, ...) — see #144.
// - type-name positions accept both built-in type keywords and user-
//   defined identifiers; uppercasing only the built-ins (`text` →
//   `TEXT`) leaves the file with mixed casing in the same arg list
//   alongside untouched user identifiers (`ulid`, ...) — see #145.
//
// `names` is libpg-query's representation for any qualified type
// reference, including the single-identifier case.
const IDENTIFIER_NODE_TYPES: ReadonlySet<string> = new Set([
  "ColumnDef",
  "RangeVar",
  "Constraint",
  "names",
]);

const collectIdentifierStarts = (program: unknown): Set<number> => {
  const starts = new Set<number>();
  const visited = new WeakSet<object>();
  const visit = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    if (visited.has(node)) return;
    visited.add(node);
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    const obj = node as Record<string, unknown>;
    if (
      typeof obj["type"] === "string" &&
      IDENTIFIER_NODE_TYPES.has(obj["type"])
    ) {
      const range = obj["range"];
      if (Array.isArray(range) && typeof range[0] === "number") {
        starts.add(range[0]);
      }
    }
    for (const [key, value] of Object.entries(obj)) {
      if (key === "parent" || key === "range" || key === "loc") continue;
      visit(value);
    }
  };
  visit(program);
  return starts;
};

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
    const option = (context.options[0] ?? {}) as { case?: CaseStyle };
    const target: CaseStyle = option.case ?? DEFAULT_CASE;
    const expected = target === "upper" ? "expectedUpper" : "expectedLower";
    const transform = (value: string) =>
      target === "upper" ? value.toUpperCase() : value.toLowerCase();

    return {
      Program(node) {
        const tokens = context.sourceCode.ast.tokens ?? [];
        const identifierStarts = collectIdentifierStarts(node);
        for (const token of tokens) {
          if (token.type !== "Keyword") continue;
          // The tokenizer is context-free — a column literally named
          // `trigger` is tagged Keyword too. Cross-reference with AST
          // identifier positions and skip any Keyword token whose
          // range starts where the parser placed an identifier.
          if (identifierStarts.has(token.range[0])) continue;
          const desired = transform(token.value);
          if (token.value === desired) continue;
          context.report({
            loc: token.loc,
            messageId: expected,
            data: { actual: token.value, expected: desired },
            fix: (fixer) => fixer.replaceTextRange(token.range, desired),
          });
        }
      },
    };
  },
};

export default rule;
