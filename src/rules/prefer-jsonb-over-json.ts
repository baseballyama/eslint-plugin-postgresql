import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { getTypeName } from "../utils/ast.js";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer `jsonb` over `json` for column types",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      preferJsonb:
        "Use `jsonb` instead of `json`. `jsonb` stores the parsed representation, supports indexing, and is what almost every application actually wants.",
    },
  },
  create(context) {
    return {
      ColumnDef(node: Ast.ColumnDef) {
        if (getTypeName(node.typeName) === "json") {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "preferJsonb",
          });
        }
      },
    };
  },
};

export default rule;
