import type { Rule } from "eslint";

type Operator = "<>" | "!=";

const DEFAULT: Operator = "<>";

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Enforce a single style for the not-equal operator (`<>` or `!=`)",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          operator: { enum: ["<>", "!="] },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferAngle: "Use `<>` instead of `!=`.",
      preferBang: "Use `!=` instead of `<>`.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { operator?: Operator };
    const target: Operator = option.operator ?? DEFAULT;
    const wrong = target === "<>" ? "!=" : "<>";
    const messageId = target === "<>" ? "preferAngle" : "preferBang";

    return {
      Program() {
        const tokens = context.sourceCode.ast.tokens ?? [];
        for (const token of tokens) {
          // The parser emits "Operator" tokens with these literal values,
          // and `!=` / `<>` cannot appear in any other token kind (string
          // contents are wrapped in quotes; comments are not tokens), so
          // matching on value alone is sufficient.
          if (token.value !== wrong) continue;
          context.report({
            loc: token.loc,
            messageId,
            fix: (fixer) => fixer.replaceTextRange(token.range, target),
          });
        }
      },
    };
  },
};

export default rule;
