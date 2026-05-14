import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description: "Require a trailing `;` at the end of the SQL file",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [],
    messages: {
      missingSemicolon: "Missing trailing `;` at the end of the file.",
    },
  },
  create(context) {
    return {
      Program() {
        const tokens = context.sourceCode.ast.tokens ?? [];
        const last = tokens.at(-1);
        if (!last) return;
        if (last.value === ";") return;
        const insertAt = last.range[1];
        context.report({
          loc: last.loc,
          messageId: "missingSemicolon",
          fix: (fixer) => fixer.insertTextAfterRange([insertAt, insertAt], ";"),
        });
      },
    };
  },
};

export default rule;
