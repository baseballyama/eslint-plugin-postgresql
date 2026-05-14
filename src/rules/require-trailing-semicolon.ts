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
        // The parser's per-statement `range[1]` is unreliable for
        // single-statement files (it tracks the inner descendant
        // aggregate rather than the absolute statement boundary), and
        // a `;` missing in the middle of a multi-statement file would
        // make libpg-query fail to parse the whole file — at which
        // point `no-syntax-error` is the diagnostic the user actually
        // needs, not a guess about where to insert `;`. So the rule
        // operates at file level: the last source token must be `;`.
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
