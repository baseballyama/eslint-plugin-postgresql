import type { RuleModule } from "../utils/rule.js";
import type { Ast } from "postgresql-eslint-parser";

const rule: RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require a WHERE clause in UPDATE statements",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      missingWhere:
        "UPDATE without WHERE rewrites every row in the table. Add a WHERE clause to scope the change.",
    },
  },
  create(context) {
    return {
      UpdateStmt(node: Ast.UpdateStmt) {
        if (!node.whereClause) {
          context.report({
            node,
            messageId: "missingWhere",
          });
        }
      },
    };
  },
};

export default rule;
