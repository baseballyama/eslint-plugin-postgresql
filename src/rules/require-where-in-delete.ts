import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require a WHERE clause in DELETE statements",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      missingWhere:
        "DELETE without WHERE removes every row in the table. Add a WHERE clause, or use TRUNCATE if you really mean to empty the table.",
    },
  },
  create(context) {
    return {
      DeleteStmt(node: Ast.DeleteStmt) {
        if (!node.whereClause) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "missingWhere",
          });
        }
      },
    };
  },
};

export default rule;
