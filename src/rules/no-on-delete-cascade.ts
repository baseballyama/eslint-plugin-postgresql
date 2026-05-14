import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `ON DELETE CASCADE` on foreign keys; cascading deletes are easy to write but can wipe out far more rows than the author intended",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noCascade:
        "Avoid `ON DELETE CASCADE`. The deletion will silently propagate through every dependent row; prefer an explicit `RESTRICT` or `SET NULL` action and handle the cleanup in application code.",
    },
  },
  create(context) {
    return {
      Constraint(node: Ast.Constraint) {
        const contype = (node as { contype?: string }).contype;
        if (contype !== "CONSTR_FOREIGN") return;
        // libpg-query encodes ON DELETE CASCADE as fk_del_action === "c".
        const action = (node as { fk_del_action?: string }).fk_del_action;
        if (action !== "c") return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noCascade",
        });
      },
    };
  },
};

export default rule;
