import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow GRANT statements that target the `PUBLIC` pseudo-role",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noPublic:
        "Avoid `GRANT ... TO PUBLIC`. The PUBLIC role covers every current and future role in the database, including ones added later for unrelated services. Name the role(s) you actually want to grant to.",
    },
  },
  create(context) {
    return {
      GrantStmt(node: any) {
        if (!node.is_grant) return;
        const grantees = Array.isArray(node.grantees) ? node.grantees : [];
        for (const g of grantees) {
          if (g?.roletype === "ROLESPEC_PUBLIC") {
            context.report({ node, messageId: "noPublic" });
            return;
          }
        }
      },
    };
  },
};

export default rule;
