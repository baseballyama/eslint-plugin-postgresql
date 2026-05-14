import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { getTypeName } from "../utils/ast.js";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow the blank-padded `char(n)` / `bpchar` column type",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noChar:
        "Avoid `char(n)`. PostgreSQL pads stored values to `n` with trailing spaces and trims on read, which surprises every comparison and round-trip. Use `text` instead.",
    },
  },
  create(context) {
    return {
      ColumnDef(node: Ast.ColumnDef) {
        if (getTypeName(node.typeName) === "bpchar") {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "noChar",
          });
        }
      },
    };
  },
};

export default rule;
