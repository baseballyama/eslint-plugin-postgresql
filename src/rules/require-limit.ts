import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

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
      SelectStmt(node: Ast.SelectStmt) {
        // A SELECT has a LIMIT if `limitCount` is set and `limitOption`
        // isn't the parser's default sentinel.
        const hasLimit =
          node.limitCount != null &&
          node.limitOption !== "LIMIT_OPTION_DEFAULT";
        if (!hasLimit) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "missingLimit",
          });
        }
      },
    };
  },
};

export default rule;
