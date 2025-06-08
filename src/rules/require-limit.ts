import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require LIMIT clause in SELECT statements",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      missingLimit:
        "SELECT statement should include a LIMIT clause to prevent excessive data retrieval",
    },
  },
  create(context) {
    return {
      SelectStmt(node: any) {
        // Check if this is a SELECT statement without LIMIT
        // A SELECT statement has LIMIT if limitCount exists and limitOption is not LIMIT_OPTION_DEFAULT
        const hasLimit =
          node.limitCount && node.limitOption !== "LIMIT_OPTION_DEFAULT";

        if (!hasLimit) {
          context.report({
            node,
            messageId: "missingLimit",
          });
        }
      },
    };
  },
};

export default rule;
