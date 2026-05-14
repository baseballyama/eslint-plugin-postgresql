import type { Rule } from "eslint";

type CaseStyle = "upper" | "lower";

const DEFAULT_CASE: CaseStyle = "upper";

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Enforce a consistent case (upper or lower) for SQL keywords",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          case: { enum: ["upper", "lower"] },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      expectedUpper:
        "SQL keyword '{{actual}}' should be uppercase: '{{expected}}'.",
      expectedLower:
        "SQL keyword '{{actual}}' should be lowercase: '{{expected}}'.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { case?: CaseStyle };
    const target: CaseStyle = option.case ?? DEFAULT_CASE;
    const expected = target === "upper" ? "expectedUpper" : "expectedLower";
    const transform = (value: string) =>
      target === "upper" ? value.toUpperCase() : value.toLowerCase();

    return {
      Program() {
        const tokens = context.sourceCode.ast.tokens ?? [];
        for (const token of tokens) {
          if (token.type !== "Keyword") continue;
          const desired = transform(token.value);
          if (token.value === desired) continue;
          context.report({
            loc: token.loc,
            messageId: expected,
            data: { actual: token.value, expected: desired },
            fix: (fixer) => fixer.replaceTextRange(token.range, desired),
          });
        }
      },
    };
  },
};

export default rule;
