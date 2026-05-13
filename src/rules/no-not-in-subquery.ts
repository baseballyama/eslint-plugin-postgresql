import type { Rule } from "eslint";

const isNotInSubquery = (node: any): boolean => {
  // The visitor key guarantees this is a BoolExpr; only check what
  // distinguishes `NOT IN (subquery)` from other `NOT (...)` shapes.
  if (node.boolop !== "NOT_EXPR") return false;
  const args = Array.isArray(node.args) ? node.args : [];
  if (args.length !== 1) return false;
  const arg = args[0];
  if (arg?.type !== "SubLink") return false;
  if (arg.subLinkType !== "ANY_SUBLINK") return false;
  // `NOT IN (subq)` parses without an explicit operName.
  // `NOT (x = ANY(subq))` would set operName, so excluding it leaves only NOT IN.
  if (arg.operName) return false;
  // `NOT IN (subq)` always has a testexpr; rule out the rare bare-ANY form.
  if (!arg.testexpr) return false;
  return true;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `NOT IN (subquery)` because NULL values in the subquery silently return zero rows",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noNotInSubquery:
        "`NOT IN (subquery)` returns no rows if the subquery yields any NULL — almost certainly not what you want. Use `NOT EXISTS (SELECT 1 FROM ... WHERE ...)` instead; it handles NULL correctly.",
    },
  },
  create(context) {
    return {
      BoolExpr(node: any) {
        if (isNotInSubquery(node)) {
          context.report({ node, messageId: "noNotInSubquery" });
        }
      },
    };
  },
};

export default rule;
