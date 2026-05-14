import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "When `ORDER BY` specifies an explicit direction, require an explicit `NULLS FIRST` / `NULLS LAST` so null ordering is not implicit",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      preferExplicitNullOrdering:
        "`ORDER BY ... ASC|DESC` without `NULLS FIRST` / `NULLS LAST` relies on PostgreSQL's implicit ordering (NULLS LAST for ASC, NULLS FIRST for DESC), which trips up cross-database readers. Add an explicit `NULLS FIRST` / `NULLS LAST`.",
    },
  },
  create(context) {
    return {
      SortBy(node: Ast.SortBy) {
        // Only flag when the user already specified a direction. Plain
        // `ORDER BY x` is left alone; this rule is about making *explicit*
        // ASC/DESC orderings fully unambiguous.
        if (
          node.sortby_dir !== "SORTBY_ASC" &&
          node.sortby_dir !== "SORTBY_DESC" &&
          node.sortby_dir !== "SORTBY_USING"
        )
          return;
        if (node.sortby_nulls !== "SORTBY_NULLS_DEFAULT") return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "preferExplicitNullOrdering",
        });
      },
    };
  },
};

export default rule;
