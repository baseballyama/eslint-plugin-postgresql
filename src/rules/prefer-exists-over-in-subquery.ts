import type { Rule } from "eslint";
import { isSubLink } from "../utils/ast.js";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer `EXISTS (...)` over `... IN (subquery)` so NULL handling is unambiguous and the planner can use a semi-join",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      preferExists:
        "Use `EXISTS (...)` instead of `IN (subquery)`. `IN` returns NULL when the subquery has any NULL row, which silently turns the row into a no-match; `EXISTS` is unambiguously boolean.",
    },
  },
  create(context) {
    return {
      SubLink(node: { subLinkType?: unknown }) {
        // ANY_SUBLINK covers both `x IN (subquery)` and the
        // semantically-equivalent `x = ANY (subquery)` form.
        if (node.subLinkType !== "ANY_SUBLINK") return;
        if (!isSubLink(node)) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "preferExists",
        });
      },
    };
  },
};

export default rule;
