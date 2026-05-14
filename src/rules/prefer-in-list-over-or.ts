import type { Rule } from "eslint";
import { getFullSourceRange } from "../utils/ast.js";

interface EqArg {
  // Range covering the right-hand side of an `lhs = rhs` term. Used to
  // slice the original source for the IN-list rewrite.
  rhsRange: [number, number];
}

interface EqExpr {
  lexpr: unknown;
  rexpr: unknown;
}

const isEquality = (node: unknown): node is EqExpr => {
  if (typeof node !== "object" || node === null) return false;
  const n = node as { type?: unknown };
  if (n.type !== "A_Expr") return false;
  const expr = n as { kind?: unknown; name?: unknown };
  if (expr.kind !== "AEXPR_OP") return false;
  if (!Array.isArray(expr.name) || expr.name.length !== 1) return false;
  if ((expr.name[0] as { sval?: unknown }).sval !== "=") return false;
  return true;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer `x IN (a, b, c)` over a chain of `x = a OR x = b OR x = c`",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [],
    messages: {
      preferIn:
        "Combine these `=` checks on `{{lhs}}` into a single `IN (...)` clause.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    return {
      // Runtime AST tag is `BoolExpr`; the upstream type alias is
      // `BoolExprPG`. Visit by the runtime name.
      BoolExpr(node: { boolop?: string; args?: unknown[] }) {
        if (node.boolop !== "OR_EXPR") return;
        const args = node.args;
        if (!Array.isArray(args) || args.length < 2) return;

        // Every disjunct must be an equality on the same lexpr (compared
        // by source text — that catches qualified columns and casts
        // without re-implementing equality across AST shapes).
        const eqArgs: EqArg[] = [];
        let lhsText: string | null = null;
        let chainStart = Number.POSITIVE_INFINITY;
        let chainEnd = -1;
        for (const arg of args) {
          if (!isEquality(arg)) return;
          // Compute true source ranges by walking descendants — the
          // node's own `range` is partial for `TypeCast` (`'lit'::T`
          // collapses to just `::`), which would corrupt the rewrite
          // (#140).
          const lhsR = getFullSourceRange(arg.lexpr);
          const rhsR = getFullSourceRange(arg.rexpr);
          if (!lhsR || !rhsR) return;
          const lhsSrc = sourceCode.getText().slice(lhsR[0], lhsR[1]);
          if (lhsText === null) lhsText = lhsSrc;
          else if (lhsText !== lhsSrc) return;
          eqArgs.push({ rhsRange: rhsR });
          if (lhsR[0] < chainStart) chainStart = lhsR[0];
          if (rhsR[1] > chainEnd) chainEnd = rhsR[1];
        }
        if (lhsText === null || chainEnd < 0) return;

        const rhsTexts = eqArgs.map(({ rhsRange }) =>
          sourceCode.getText().slice(rhsRange[0], rhsRange[1]),
        );
        const replacement = `${lhsText} IN (${rhsTexts.join(", ")})`;
        context.report({
          loc: {
            start: sourceCode.getLocFromIndex(chainStart),
            end: sourceCode.getLocFromIndex(chainEnd),
          },
          messageId: "preferIn",
          data: { lhs: lhsText },
          fix: (fixer) =>
            fixer.replaceTextRange([chainStart, chainEnd], replacement),
        });
      },
    };
  },
};

export default rule;
