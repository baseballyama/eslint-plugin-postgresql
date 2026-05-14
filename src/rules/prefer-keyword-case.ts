import type { Rule } from "eslint";

type CaseStyle = "upper" | "lower";
type TypeCaseStyle = CaseStyle | "skip";

const DEFAULT_CASE: CaseStyle = "upper";
const DEFAULT_TYPES: TypeCaseStyle = "skip";

// Node types whose `range` covers a "general identifier" position —
// a column / table / constraint name. The parser tokenizer is context-
// free, so a column literally named `trigger` or `user` gets tagged
// `Keyword`. These positions are always exempt from case-folding (#144).
const GENERAL_IDENTIFIER_NODE_TYPES: ReadonlySet<string> = new Set([
  "ColumnDef",
  "RangeVar",
  "Constraint",
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
  typeNameStarts: Set<number>;
}

const collectPositions = (program: unknown): Positions => {
  const generalIdentifierStarts = new Set<number>();
  const typeNameStarts = new Set<number>();
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
    const type = obj["type"];
    if (typeof type === "string") {
      const range = obj["range"];
      const start =
        Array.isArray(range) && typeof range[0] === "number" ? range[0] : null;
      if (start !== null) {
        if (GENERAL_IDENTIFIER_NODE_TYPES.has(type)) {
          generalIdentifierStarts.add(start);
        } else if (TYPE_NAME_NODE_TYPES.has(type)) {
          typeNameStarts.add(start);
        }
      }
    }
    for (const [key, value] of Object.entries(obj)) {
      if (key === "parent" || key === "range" || key === "loc") continue;
      visit(value);
    }
  };
  visit(program);
  return { generalIdentifierStarts, typeNameStarts };
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
        const { generalIdentifierStarts, typeNameStarts } =
          collectPositions(node);
        for (const token of tokens) {
          if (token.type !== "Keyword") continue;
          if (generalIdentifierStarts.has(token.range[0])) continue;

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
