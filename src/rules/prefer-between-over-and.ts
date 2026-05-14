import type { Rule } from "eslint";
import { getFullSourceRange } from "../utils/ast.js";

const opName = (node: unknown): string | null => {
  if (typeof node !== "object" || node === null) return null;
  const n = node as { type?: unknown; kind?: unknown; name?: unknown };
  if (n.type !== "A_Expr" || n.kind !== "AEXPR_OP") return null;
  if (!Array.isArray(n.name) || n.name.length !== 1) return null;
  const sval = (n.name[0] as { sval?: unknown }).sval;
  return typeof sval === "string" ? sval : null;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer `x BETWEEN a AND b` over `x >= a AND x <= b` for closed-interval range checks",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [],
    messages: {
      preferBetween:
        "Use `{{lhs}} BETWEEN {{lower}} AND {{upper}}` instead of `>= ... AND <=`.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    return {
      // Runtime AST tag is `BoolExpr`; the upstream type alias is
      // `BoolExprPG`. Visit by the runtime name.
      BoolExpr(node: { boolop?: string; args?: unknown[] }) {
        if (node.boolop !== "AND_EXPR") return;
        const args = node.args;
        if (!Array.isArray(args) || args.length !== 2) return;
        const [a, b] = args as [unknown, unknown];
        if (opName(a) !== ">=" || opName(b) !== "<=") return;

        const aLex = (a as { lexpr?: unknown }).lexpr;
        const aRex = (a as { rexpr?: unknown }).rexpr;
        const bLex = (b as { lexpr?: unknown }).lexpr;
        const bRex = (b as { rexpr?: unknown }).rexpr;
        // `getFullSourceRange` walks descendants to recover the true
        // bounds of expressions whose own `range` is partial — most
        // notably `TypeCast`, whose range covers only the `::` /
        // `CAST` token. Without this, `'lit'::TIMESTAMPTZ` collapses
        // to just `::` in the rewrite (#140).
        const aLexR = getFullSourceRange(aLex);
        const aRexR = getFullSourceRange(aRex);
        const bLexR = getFullSourceRange(bLex);
        const bRexR = getFullSourceRange(bRex);
        if (!aLexR || !aRexR || !bLexR || !bRexR) return;

        const aLexSrc = sourceCode.getText().slice(aLexR[0], aLexR[1]);
        const bLexSrc = sourceCode.getText().slice(bLexR[0], bLexR[1]);
        if (aLexSrc !== bLexSrc) return;

        const lower = sourceCode.getText().slice(aRexR[0], aRexR[1]);
        const upper = sourceCode.getText().slice(bRexR[0], bRexR[1]);
        const replacement = `${aLexSrc} BETWEEN ${lower} AND ${upper}`;
        const start = aLexR[0];
        const end = bRexR[1];
        context.report({
          loc: {
            start: sourceCode.getLocFromIndex(start),
            end: sourceCode.getLocFromIndex(end),
          },
          messageId: "preferBetween",
          data: { lhs: aLexSrc, lower, upper },
          fix: (fixer) => fixer.replaceTextRange([start, end], replacement),
        });
      },
    };
  },
};

export default rule;
