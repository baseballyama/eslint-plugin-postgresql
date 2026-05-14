import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

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
      GrantStmt(node: Ast.GrantStmt) {
        if (!node.is_grant) return;
        // `grantees` is not in the upstream `GrantStmt` interface; the index
        // signature on the parser type lets us reach it without `any`.
        const grantees = node["grantees"];
        if (!Array.isArray(grantees)) return;
        for (const g of grantees) {
          if (
            g != null &&
            typeof g === "object" &&
            (g as { roletype?: unknown }).roletype === "ROLESPEC_PUBLIC"
          ) {
            context.report({
              node: node as unknown as Rule.Node,
              messageId: "noPublic",
            });
            return;
          }
        }
      },
    };
  },
};

export default rule;
