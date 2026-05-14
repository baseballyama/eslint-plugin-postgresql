import type { AST, Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Require the `AS` keyword before table aliases (`FROM users AS u`, not `FROM users u`)",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [],
    messages: {
      preferAs: "Use `AS` before the table alias `{{alias}}`.",
    },
  },
  create(context) {
    return {
      RangeVar(node: Ast.RangeVar) {
        // The parser exposes the alias only as { aliasname } (no range
        // of its own), so locate it by walking forward from the table
        // reference's last token.
        const alias = node.alias as { aliasname?: string } | undefined;
        if (!alias?.aliasname || !node.range) return;
        const tableEnd = node.range[1];
        const tokens = context.sourceCode.ast.tokens ?? [];
        let next: AST.Token | undefined;
        for (let i = 0; i < tokens.length; i++) {
          if (tokens[i]!.range[0] >= tableEnd) {
            next = tokens[i];
            break;
          }
        }
        if (!next) return;
        if (next.type === "Keyword" && next.value.toUpperCase() === "AS") {
          return;
        }
        // Not every token after the table reference is the alias — it
        // could be the next clause (`WHERE`, `JOIN`, ...) for an
        // aliasless reference where the parser just lost the alias info,
        // or a column-list `(col1, col2)` opening paren. Match by name
        // to be sure we are pointing at the alias identifier.
        if (next.type !== "Identifier") return;
        if (next.value !== alias.aliasname) return;
        context.report({
          loc: next.loc,
          messageId: "preferAs",
          data: { alias: alias.aliasname },
          fix: (fixer) => fixer.insertTextBeforeRange(next!.range, "AS "),
        });
      },
    };
  },
};

export default rule;
