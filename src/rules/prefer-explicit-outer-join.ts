import type { Rule } from "eslint";

const SIDE_KEYWORDS = new Set(["LEFT", "RIGHT", "FULL"]);

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Require `OUTER` to be written explicitly in `LEFT/RIGHT/FULL OUTER JOIN`",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [],
    messages: {
      preferOuterJoin:
        "Write `{{side}} OUTER JOIN` explicitly instead of `{{side}} JOIN`.",
    },
  },
  create(context) {
    return {
      Program() {
        const tokens = context.sourceCode.ast.tokens ?? [];
        for (let i = 0; i < tokens.length - 1; i++) {
          const side = tokens[i]!;
          const next = tokens[i + 1]!;
          if (side.type !== "Keyword") continue;
          const sideUpper = side.value.toUpperCase();
          if (!SIDE_KEYWORDS.has(sideUpper)) continue;
          if (next.type !== "Keyword") continue;
          if (next.value.toUpperCase() !== "JOIN") continue;
          context.report({
            loc: { start: side.loc.start, end: next.loc.end },
            messageId: "preferOuterJoin",
            data: { side: sideUpper },
            fix: (fixer) => fixer.insertTextBeforeRange(next.range, "OUTER "),
          });
        }
      },
    };
  },
};

export default rule;
