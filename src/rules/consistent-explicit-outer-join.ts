import type { Rule } from "eslint";

type Style = "always" | "never";

const DEFAULT_STYLE: Style = "always";

const SIDE_KEYWORDS = new Set(["LEFT", "RIGHT", "FULL"]);

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Enforce a consistent stance on the explicit `OUTER` keyword in `LEFT/RIGHT/FULL OUTER JOIN` (either always require it, or always forbid it)",
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
      preferOuterJoin:
        "Write `{{side}} OUTER JOIN` explicitly instead of `{{side}} JOIN`.",
      unexpectedOuterJoin:
        "Omit the redundant `OUTER`; use `{{side}} JOIN` instead of `{{side}} OUTER JOIN`.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { style?: Style };
    const style: Style = option.style ?? DEFAULT_STYLE;
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
          const nextUpper = next.value.toUpperCase();
          if (style === "always") {
            if (nextUpper !== "JOIN") continue;
            context.report({
              loc: { start: side.loc.start, end: next.loc.end },
              messageId: "preferOuterJoin",
              data: { side: sideUpper },
              fix: (fixer) => fixer.insertTextBeforeRange(next.range, "OUTER "),
            });
            continue;
          }
          // style === "never": flag `LEFT/RIGHT/FULL OUTER JOIN`.
          if (nextUpper !== "OUTER") continue;
          const after = tokens[i + 2];
          if (!after) continue;
          if (after.type !== "Keyword" || after.value.toUpperCase() !== "JOIN")
            continue;
          context.report({
            loc: { start: side.loc.start, end: after.loc.end },
            messageId: "unexpectedOuterJoin",
            data: { side: sideUpper },
            // Remove `OUTER` and the whitespace between it and `JOIN`.
            fix: (fixer) => fixer.removeRange([next.range[0], after.range[0]]),
          });
        }
      },
    };
  },
};

export default rule;
