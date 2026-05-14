import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow comma-separated FROM clauses (implicit cross joins); use explicit JOIN syntax",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noImplicitJoin:
        "Comma-separated tables in `FROM` are an implicit cross join. Use explicit `JOIN ... ON ...` so the join condition lives next to the join.",
    },
  },
  create(context) {
    return {
      SelectStmt(node: Ast.SelectStmt) {
        const fromClause = node.fromClause;
        if (Array.isArray(fromClause) && fromClause.length > 1) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "noImplicitJoin",
          });
        }
      },
    };
  },
};

export default rule;
