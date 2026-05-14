import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow `NATURAL JOIN`",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noNaturalJoin:
        "Avoid `NATURAL JOIN`. The join columns are implicit — any future column with a matching name on both sides silently changes the result. Use `JOIN ... USING (...)` or `JOIN ... ON ...` and name the columns.",
    },
  },
  create(context) {
    return {
      JoinExpr(node: Ast.JoinExpr) {
        if (node.isNatural) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "noNaturalJoin",
          });
        }
      },
    };
  },
};

export default rule;
