import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `WITH RECURSIVE` queries that have no `LIMIT` on the outer SELECT, which can run unboundedly if the recursion's termination condition is wrong",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noLimit:
        "Add a `LIMIT` to a `WITH RECURSIVE` query so a buggy or accidentally-non-terminating recursion cannot run unboundedly.",
    },
  },
  create(context) {
    return {
      SelectStmt(node: Ast.SelectStmt) {
        const withClause = (node as { withClause?: { recursive?: boolean } })
          .withClause;
        if (withClause?.recursive !== true) return;
        const limit = (node as { limitCount?: unknown }).limitCount;
        if (limit) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noLimit",
        });
      },
    };
  },
};

export default rule;
