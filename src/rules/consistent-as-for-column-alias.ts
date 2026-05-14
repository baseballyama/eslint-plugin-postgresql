import type { AST, Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isResTarget } from "../utils/ast.js";

type Style = "always" | "never";

const DEFAULT_STYLE: Style = "always";

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Enforce a consistent stance on the `AS` keyword before column aliases in `SELECT` (either always require it, or always forbid it)",
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
      preferAs: "Use `AS` before the column alias `{{alias}}`.",
      unexpectedAs: "Omit `AS` before the column alias `{{alias}}`.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { style?: Style };
    const style: Style = option.style ?? DEFAULT_STYLE;
    return {
      // Only flag aliases that appear in SELECT's targetList. The same
      // ResTarget node type is used for INSERT column lists and UPDATE
      // SET clauses where inserting `AS ` would be a syntax error.
      SelectStmt(node: Ast.SelectStmt) {
        const targetList = node.targetList;
        if (!Array.isArray(targetList)) return;
        const tokens = context.sourceCode.ast.tokens ?? [];
        for (const target of targetList) {
          if (!isResTarget(target)) continue;
          if (!target.name) continue;
          const val = target.val as { range?: [number, number] } | undefined;
          if (!val?.range) continue;
          const valEnd = val.range[1];
          let next: AST.Token | undefined;
          let nextIndex = -1;
          for (let i = 0; i < tokens.length; i++) {
            if (tokens[i]!.range[0] >= valEnd) {
              next = tokens[i];
              nextIndex = i;
              break;
            }
          }
          if (!next || nextIndex < 0) continue;
          const hasAs =
            next.type === "Keyword" && next.value.toUpperCase() === "AS";
          if (style === "always" && !hasAs) {
            context.report({
              loc: next.loc,
              messageId: "preferAs",
              data: { alias: target.name },
              fix: (fixer) => fixer.insertTextBeforeRange(next!.range, "AS "),
            });
            continue;
          }
          if (style === "never" && hasAs) {
            const after = tokens[nextIndex + 1];
            if (!after) continue;
            context.report({
              loc: next.loc,
              messageId: "unexpectedAs",
              data: { alias: target.name },
              // Drop the `AS` keyword plus the whitespace separating
              // it from the alias identifier.
              fix: (fixer) =>
                fixer.removeRange([next!.range[0], after.range[0]]),
            });
          }
        }
      },
    };
  },
};

export default rule;
