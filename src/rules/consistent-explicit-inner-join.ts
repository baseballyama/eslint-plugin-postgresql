import type { Rule } from "eslint";

type Style = "always" | "never";

const DEFAULT_STYLE: Style = "always";

// Keywords that, when they appear immediately before `JOIN`, already
// declare the join's kind. A bare `JOIN` (none of these preceding it)
// is the case `always` mode rewrites to `INNER JOIN`.
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
      description:
        "Enforce a consistent stance on the explicit `INNER` keyword in `INNER JOIN` (either always require it, or always forbid it)",
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
      preferInnerJoin: "Write `INNER JOIN` explicitly instead of bare `JOIN`.",
      unexpectedInnerJoin:
        "Omit the redundant `INNER`; use bare `JOIN` for inner joins.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { style?: Style };
    const style: Style = option.style ?? DEFAULT_STYLE;
    return {
      Program() {
        const tokens = context.sourceCode.ast.tokens ?? [];
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i]!;
          if (token.type !== "Keyword") continue;
          if (token.value.toUpperCase() !== "JOIN") continue;
          const prev = tokens[i - 1];
          const prevIsKind =
            prev?.type === "Keyword" &&
            JOIN_KIND_KEYWORDS.has(prev.value.toUpperCase());
          if (style === "always") {
            if (prevIsKind) continue;
            context.report({
              loc: token.loc,
              messageId: "preferInnerJoin",
              fix: (fixer) =>
                fixer.insertTextBeforeRange(token.range, "INNER "),
            });
            continue;
          }
          // style === "never": flag explicit `INNER JOIN`.
          if (!prev) continue;
          if (prev.type !== "Keyword" || prev.value.toUpperCase() !== "INNER") {
            continue;
          }
          context.report({
            loc: { start: prev.loc.start, end: token.loc.end },
            messageId: "unexpectedInnerJoin",
            // Remove `INNER` plus the whitespace between it and `JOIN`.
            fix: (fixer) => fixer.removeRange([prev.range[0], token.range[0]]),
          });
        }
      },
    };
  },
};

export default rule;
