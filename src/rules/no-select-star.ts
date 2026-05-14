import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isAStar, isColumnRef, isResTarget } from "../utils/ast.js";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `SELECT *` in queries to keep result schemas stable when the underlying table changes",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noSelectStar:
        "Avoid `SELECT *`; list the columns you need so the result schema does not silently change when the table does.",
    },
  },
  create(context) {
    return {
      SelectStmt(node: Ast.SelectStmt) {
        const targetList = node.targetList;
        if (!Array.isArray(targetList)) return;
        for (const target of targetList) {
          if (!isResTarget(target)) continue;
          const val = target.val;
          if (!isColumnRef(val)) continue;
          if (val.fields.some(isAStar)) {
            context.report({
              node: target as unknown as Rule.Node,
              messageId: "noSelectStar",
            });
          }
        }
      },
    };
  },
};

export default rule;
