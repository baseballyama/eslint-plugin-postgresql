import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer `DROP INDEX CONCURRENTLY` over plain `DROP INDEX` to avoid holding an `ACCESS EXCLUSIVE` lock on the table",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      preferConcurrently:
        "Use `DROP INDEX CONCURRENTLY` to avoid an `ACCESS EXCLUSIVE` lock on the table for the entire drop.",
    },
  },
  create(context) {
    return {
      DropStmt(node: Ast.DropStmt) {
        if (node.removeType !== "OBJECT_INDEX") return;
        if (node.concurrent === true) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "preferConcurrently",
        });
      },
    };
  },
};

export default rule;
