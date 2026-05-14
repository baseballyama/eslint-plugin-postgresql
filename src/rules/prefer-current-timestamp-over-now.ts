import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Prefer the SQL-standard `CURRENT_TIMESTAMP` over PostgreSQL's `now()`",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [],
    messages: {
      preferCurrentTimestamp:
        "Use the SQL-standard `CURRENT_TIMESTAMP` instead of `now()`.",
    },
  },
  create(context) {
    return {
      Program() {
        const tokens = context.sourceCode.ast.tokens ?? [];
        for (let i = 0; i < tokens.length - 2; i++) {
          const id = tokens[i]!;
          const open = tokens[i + 1]!;
          const close = tokens[i + 2]!;
          if (id.type !== "Identifier") continue;
          if (id.value.toLowerCase() !== "now") continue;
          if (open.type !== "Punctuator" || open.value !== "(") continue;
          if (close.type !== "Punctuator" || close.value !== ")") continue;
          context.report({
            loc: { start: id.loc.start, end: close.loc.end },
            messageId: "preferCurrentTimestamp",
            fix: (fixer) =>
              fixer.replaceTextRange(
                [id.range[0], close.range[1]],
                "CURRENT_TIMESTAMP",
              ),
          });
        }
      },
    };
  },
};

export default rule;
