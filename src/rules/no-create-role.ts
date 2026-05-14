import type { Rule } from "eslint";

interface CreateRoleStmt {
  type: "CreateRoleStmt";
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `CREATE ROLE` / `CREATE USER` in application migrations; manage roles in a separate operator workflow",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noCreateRole:
        "`CREATE ROLE` / `CREATE USER` belongs in an operator-managed bootstrap (Terraform, Pulumi, a runbook), not in application migrations. Migration files run with whichever role the deploy uses and are not the right place to manage permissions.",
    },
  },
  create(context) {
    return {
      CreateRoleStmt(node: CreateRoleStmt) {
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noCreateRole",
        });
      },
    };
  },
};

export default rule;
