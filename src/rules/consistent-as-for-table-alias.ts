import type { AST, Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

type Style = "always" | "never";

const DEFAULT_STYLE: Style = "always";

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Enforce a consistent stance on the `AS` keyword before table aliases (either always require it, or always forbid it)",
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
      preferAs: "Use `AS` before the table alias `{{alias}}`.",
      unexpectedAs: "Omit `AS` before the table alias `{{alias}}`.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { style?: Style };
    const style: Style = option.style ?? DEFAULT_STYLE;
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
        let nextIndex = -1;
        for (let i = 0; i < tokens.length; i++) {
          if (tokens[i]!.range[0] >= tableEnd) {
            next = tokens[i];
            nextIndex = i;
            break;
          }
        }
        if (!next || nextIndex < 0) return;
        const hasAs =
          next.type === "Keyword" && next.value.toUpperCase() === "AS";
        if (style === "always") {
          if (hasAs) return;
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
          return;
        }
        // style === "never"
        if (!hasAs) return;
        const after = tokens[nextIndex + 1];
        if (!after) return;
        // Make sure the identifier following `AS` is the alias we
        // expect, not part of an unrelated clause.
        if (after.type !== "Identifier") return;
        if (after.value !== alias.aliasname) return;
        context.report({
          loc: next.loc,
          messageId: "unexpectedAs",
          data: { alias: alias.aliasname },
          fix: (fixer) => fixer.removeRange([next!.range[0], after.range[0]]),
        });
      },
    };
  },
};

export default rule;
