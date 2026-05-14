import type { Rule } from "eslint";
import { getFullSourceRange } from "../utils/ast.js";

type Style = "always" | "never";

const DEFAULT_STYLE: Style = "always";

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
        "Enforce a consistent stance on `x BETWEEN a AND b` vs `x >= a AND x <= b` for closed-interval range checks",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          style: { enum: ["always", "never"] },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferBetween:
        "Use `{{lhs}} BETWEEN {{lower}} AND {{upper}}` instead of `>= ... AND <=`.",
      unexpectedBetween:
        "Use `{{lhs}} >= {{lower}} AND {{lhs}} <= {{upper}}` instead of `BETWEEN`. Some teams prefer explicit comparisons so the inclusive bounds are obvious to readers.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { style?: Style };
    const style: Style = option.style ?? DEFAULT_STYLE;
    const sourceCode = context.sourceCode;
    return {
      // Runtime AST tag is `BoolExpr`; the upstream type alias is
      // `BoolExprPG`. Visit by the runtime name.
      BoolExpr(node: { boolop?: string; args?: unknown[] }) {
        if (style !== "always") return;
        if (node.boolop !== "AND_EXPR") return;
        const args = node.args;
        if (!Array.isArray(args) || args.length !== 2) return;
        const [a, b] = args as [unknown, unknown];
        if (opName(a) !== ">=" || opName(b) !== "<=") return;

        const aLex = (a as { lexpr?: unknown }).lexpr;
        const aRex = (a as { rexpr?: unknown }).rexpr;
        const bLex = (b as { lexpr?: unknown }).lexpr;
        const bRex = (b as { rexpr?: unknown }).rexpr;
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
      A_Expr(node: { kind?: string; lexpr?: unknown; rexpr?: unknown }) {
        if (style !== "never") return;
        if (node.kind !== "AEXPR_BETWEEN" && node.kind !== "AEXPR_BETWEEN_SYM")
          return;
        const lexpr = node.lexpr;
        // `rexpr` for BETWEEN is a `List` node whose `items` are the
        // lower and upper bounds (in that order).
        const rexpr = node.rexpr as { items?: unknown[] } | undefined;
        const items = rexpr?.items;
        if (!Array.isArray(items) || items.length !== 2) return;
        const lhsR = getFullSourceRange(lexpr);
        const lowerR = getFullSourceRange(items[0]);
        const upperR = getFullSourceRange(items[1]);
        if (!lhsR || !lowerR || !upperR) return;
        const lhsSrc = sourceCode.getText().slice(lhsR[0], lhsR[1]);
        const lowerSrc = sourceCode.getText().slice(lowerR[0], lowerR[1]);
        const upperSrc = sourceCode.getText().slice(upperR[0], upperR[1]);
        const replacement = `${lhsSrc} >= ${lowerSrc} AND ${lhsSrc} <= ${upperSrc}`;
        const start = lhsR[0];
        const end = upperR[1];
        context.report({
          loc: {
            start: sourceCode.getLocFromIndex(start),
            end: sourceCode.getLocFromIndex(end),
          },
          messageId: "unexpectedBetween",
          data: { lhs: lhsSrc, lower: lowerSrc, upper: upperSrc },
          fix: (fixer) => fixer.replaceTextRange([start, end], replacement),
        });
      },
    };
  },
};

export default rule;
