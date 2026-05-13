import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow `CROSS JOIN` (unqualified cartesian product)",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noCrossJoin:
        "Avoid `CROSS JOIN`. Cartesian products are almost always a mistake; use an explicit `JOIN ... ON` with a join condition, or `JOIN ... ON true` if you really do want one.",
    },
  },
  create(context) {
    return {
      JoinExpr(node: any) {
        const isCrossJoin =
          node.jointype === "JOIN_INNER" &&
          !node.quals &&
          !node.usingClause &&
          !node.isNatural;
        if (isCrossJoin) {
          context.report({ node, messageId: "noCrossJoin" });
        }
      },
    };
  },
};

export default rule;
