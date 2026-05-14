import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { getTypeName } from "../utils/ast.js";

type Style = "always" | "never";

const DEFAULT_STYLE: Style = "always";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce a consistent stance on `jsonb` vs `json` for column types",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [
      {
        type: "object",
        properties: {
          style: { enum: ["always", "never"] },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferJsonb:
        "Use `jsonb` instead of `json`. `jsonb` stores the parsed representation, supports indexing, and is what almost every application actually wants.",
      unexpectedJsonb:
        "Use `json` instead of `jsonb`. Useful when the project intentionally relies on `json`'s preservation of key order, whitespace, and duplicate keys.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { style?: Style };
    const style: Style = option.style ?? DEFAULT_STYLE;
    return {
      ColumnDef(node: Ast.ColumnDef) {
        const t = getTypeName(node.typeName);
        if (style === "always" && t === "json") {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "preferJsonb",
          });
          return;
        }
        if (style === "never" && t === "jsonb") {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "unexpectedJsonb",
          });
        }
      },
    };
  },
};

export default rule;
