import type { AST, Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description: "Require a trailing `;` after every top-level SQL statement",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [],
    messages: {
      missingSemicolon: "Missing trailing `;` after statement.",
    },
  },
  create(context) {
    return {
      Program(node) {
        const body = (node as { body?: unknown }).body;
        if (!Array.isArray(body)) return;
        const tokens = context.sourceCode.ast.tokens ?? [];
        for (const stmt of body) {
          const range = (stmt as { range?: [number, number] }).range;
          const loc = (stmt as { loc?: AST.SourceLocation }).loc;
          if (!range || !loc) continue;
          const stmtEnd = range[1];
          // The parser does not emit whitespace tokens, so the next
          // entry whose range starts at or after the statement end is
          // the very next source token.
          let next: AST.Token | undefined;
          for (let i = 0; i < tokens.length; i++) {
            if (tokens[i]!.range[0] >= stmtEnd) {
              next = tokens[i];
              break;
            }
          }
          if (next?.value === ";") continue;
          context.report({
            loc,
            messageId: "missingSemicolon",
            fix: (fixer) => fixer.insertTextAfterRange([stmtEnd, stmtEnd], ";"),
          });
        }
      },
    };
  },
};

export default rule;
