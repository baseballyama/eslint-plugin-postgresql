import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isRangeFunction, isRangeSubselect } from "../utils/ast.js";

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
      JoinExpr(node: Ast.JoinExpr) {
        // `CROSS JOIN LATERAL (...)` is the idiomatic way to correlate a
        // subquery or set-returning function with the row on its left. The
        // right side references the left, so it cannot produce the unintended
        // cartesian product this rule exists to catch, and there is no
        // `ON` clause to write instead.
        const rarg = node.rarg;
        const isLateral =
          (isRangeSubselect(rarg) || isRangeFunction(rarg)) &&
          rarg.lateral === true;
        if (isLateral) return;

        const isCrossJoin =
          node.jointype === "JOIN_INNER" &&
          !node.quals &&
          !node.usingClause &&
          !node.isNatural;
        if (isCrossJoin) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "noCrossJoin",
          });
        }
      },
    };
  },
};

export default rule;
