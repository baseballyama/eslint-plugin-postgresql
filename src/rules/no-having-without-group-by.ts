import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `HAVING` without `GROUP BY` — the query aggregates the entire result set, which is almost never the intended shape",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noHavingWithoutGroupBy:
        "`HAVING` without `GROUP BY` collapses the query to one aggregate row over the whole table. If that is intended, put the predicate in `WHERE`. Otherwise, add a `GROUP BY`.",
    },
  },
  create(context) {
    return {
      SelectStmt(node: Ast.SelectStmt) {
        if (!node.havingClause) return;
        if (Array.isArray(node.groupClause) && node.groupClause.length > 0)
          return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noHavingWithoutGroupBy",
        });
      },
    };
  },
};

export default rule;
