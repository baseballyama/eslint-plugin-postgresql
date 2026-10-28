import type { AST } from "eslint";
import type { RuleModule } from "../utils/rule.js";
import type { Ast } from "postgresql-eslint-parser";

type Style = "always" | "never";

const DEFAULT_STYLE: Style = "always";

const rule: RuleModule = {
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
    const sourceCode = context.sourceCode;
    const isAs = (token: AST.Token | null | undefined) =>
      token?.type === "Keyword" && token.value.toUpperCase() === "AS";
    const check = (
      asToken: AST.Token | null,
      aliasToken: AST.Token | null | undefined,
      aliasname: string,
    ) => {
      // The candidate token is not always the alias — after a table
      // reference it could be the next clause (`WHERE`, `JOIN`, ...) for
      // an aliasless reference where the parser just lost the alias info,
      // or a column-list `(col1, col2)` opening paren. Match by name
      // to be sure we are pointing at the alias identifier.
      if (aliasToken?.type !== "Identifier") return;
      if (aliasToken.value !== aliasname) return;
      if (style === "always" && !asToken) {
        context.report({
          loc: aliasToken.loc,
          messageId: "preferAs",
          data: { alias: aliasname },
          fix: (fixer) => fixer.insertTextBeforeRange(aliasToken.range, "AS "),
        });
      }
      if (style === "never" && asToken) {
        context.report({
          loc: asToken.loc,
          messageId: "unexpectedAs",
          data: { alias: aliasname },
          fix: (fixer) =>
            fixer.removeRange([asToken.range[0], aliasToken.range[0]]),
        });
      }
    };
    // A subquery, function call or parenthesized join ends with `)`, but
    // its own range stops short of it, so start from the alias instead.
    // When the parser cannot place the alias, the alias range points at
    // the start of the node, and the `)` check below rejects it.
    const visitParenthesized = (
      node: Ast.RangeSubselect | Ast.RangeFunction | Ast.JoinExpr,
    ) => {
      if (!node.alias) return;
      const aliasToken = sourceCode.getTokenByRangeStart(node.alias.range[0]);
      if (!aliasToken) return;
      const before = sourceCode.getTokenBefore(aliasToken);
      const asToken = isAs(before) ? before : null;
      const close = asToken ? sourceCode.getTokenBefore(asToken) : before;
      if (close?.value !== ")") return;
      check(asToken, aliasToken, node.alias.aliasname);
    };
    return {
      RangeVar(node: Ast.RangeVar) {
        // The parser exposes the alias only as { aliasname } (no range
        // of its own), so locate it by walking forward from the table
        // reference's last token.
        const alias = node.alias as { aliasname?: string } | undefined;
        if (!alias?.aliasname || !node.range) return;
        const tableEnd = node.range[1];
        const tokens = sourceCode.ast.tokens ?? [];
        const nextIndex = tokens.findIndex(
          (token) => token.range[0] >= tableEnd,
        );
        if (nextIndex < 0) return;
        const hasAs = isAs(tokens[nextIndex]);
        check(
          hasAs ? tokens[nextIndex]! : null,
          tokens[hasAs ? nextIndex + 1 : nextIndex],
          alias.aliasname,
        );
      },
      RangeSubselect: visitParenthesized,
      RangeFunction: visitParenthesized,
      JoinExpr: visitParenthesized,
    };
  },
};

export default rule;
