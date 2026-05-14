import type { AST, Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isResTarget } from "../utils/ast.js";

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Require the `AS` keyword before column aliases in `SELECT` (`SELECT id AS user_id`, not `SELECT id user_id`)",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [],
    messages: {
      preferAs: "Use `AS` before the column alias `{{alias}}`.",
    },
  },
  create(context) {
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
          if (next.type === "Keyword" && next.value.toUpperCase() === "AS") {
            continue;
          }
          context.report({
            loc: next.loc,
            messageId: "preferAs",
            data: { alias: target.name },
            fix: (fixer) => fixer.insertTextBeforeRange(next!.range, "AS "),
          });
        }
      },
    };
  },
};

export default rule;
