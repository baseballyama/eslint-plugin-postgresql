import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isSubLink } from "../utils/ast.js";

const isNotInSubquery = (node: Ast.BoolExprPG): boolean => {
  // The visitor key guarantees this is a BoolExpr; only check what
  // distinguishes `NOT IN (subquery)` from other `NOT (...)` shapes.
  if (node.boolop !== "NOT_EXPR") return false;
  const args = node.args;
  if (!Array.isArray(args) || args.length !== 1) return false;
  const arg = args[0];
  if (!isSubLink(arg)) return false;
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
      BoolExpr(node: Ast.BoolExprPG) {
        if (isNotInSubquery(node)) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "noNotInSubquery",
          });
        }
      },
    };
  },
};

export default rule;
