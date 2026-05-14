import type { Rule } from "eslint";

// Keywords that, when they appear immediately before `JOIN`, already
// declare the join's kind. A bare `JOIN` (none of these preceding it)
// is the case this rule rewrites to `INNER JOIN`.
const JOIN_KIND_KEYWORDS = new Set([
  "INNER",
  "OUTER",
  "LEFT",
  "RIGHT",
  "FULL",
  "CROSS",
  "NATURAL",
]);

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description: "Require `INNER JOIN` instead of bare `JOIN`",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [],
    messages: {
      preferInnerJoin: "Write `INNER JOIN` explicitly instead of bare `JOIN`.",
    },
  },
  create(context) {
    return {
      Program() {
        const tokens = context.sourceCode.ast.tokens ?? [];
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i]!;
          if (token.type !== "Keyword") continue;
          if (token.value.toUpperCase() !== "JOIN") continue;
          const prev = tokens[i - 1];
          if (
            prev?.type === "Keyword" &&
            JOIN_KIND_KEYWORDS.has(prev.value.toUpperCase())
          ) {
            continue;
          }
          context.report({
            loc: token.loc,
            messageId: "preferInnerJoin",
            fix: (fixer) => fixer.insertTextBeforeRange(token.range, "INNER "),
          });
        }
      },
    };
  },
};

export default rule;
