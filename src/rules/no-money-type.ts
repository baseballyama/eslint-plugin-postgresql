import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { getTypeName } from "../utils/ast.js";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow the `money` column type",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noMoney:
        "Avoid `money`. Its output format and precision depend on `lc_monetary`, so the same row looks different on different servers and round-trips badly. Store amounts as `numeric` and keep the currency in a separate column.",
    },
  },
  create(context) {
    return {
      ColumnDef(node: Ast.ColumnDef) {
        if (getTypeName(node.typeName) === "money") {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "noMoney",
          });
        }
      },
    };
  },
};

export default rule;
