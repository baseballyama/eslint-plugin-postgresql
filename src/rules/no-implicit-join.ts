import type { Rule } from "eslint";

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
      SelectStmt(node: any) {
        const fromClause = Array.isArray(node?.fromClause)
          ? node.fromClause
          : [];
        if (fromClause.length > 1) {
          context.report({ node, messageId: "noImplicitJoin" });
        }
      },
    };
  },
};

export default rule;
