import type { Rule } from "eslint";

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
      DeleteStmt(node: any) {
        if (!node.whereClause) {
          context.report({ node, messageId: "missingWhere" });
        }
      },
    };
  },
};

export default rule;
