import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `UPDATE ... FROM other_table` without a `WHERE` clause; without a join condition the FROM table forms a Cartesian product with the target table and updates every row of the target as many times as `other_table` has rows",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      missingJoin:
        "`UPDATE ... FROM` without a `WHERE` clause produces a Cartesian product with the target table; add a `WHERE t.x = other.x` condition to bind the rows.",
    },
  },
  create(context) {
    return {
      UpdateStmt(node: Ast.UpdateStmt) {
        const fromClause = (node as { fromClause?: unknown }).fromClause;
        if (!Array.isArray(fromClause) || fromClause.length === 0) return;
        const whereClause = (node as { whereClause?: unknown }).whereClause;
        if (whereClause != null) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "missingJoin",
        });
      },
    };
  },
};

export default rule;
