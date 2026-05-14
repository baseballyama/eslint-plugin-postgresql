import type { Rule } from "eslint";

interface ClusterStmt {
  type: "ClusterStmt";
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow the `CLUSTER` statement: it takes ACCESS EXCLUSIVE, rewrites the table, and is not maintained afterwards",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noCluster:
        "`CLUSTER` takes `ACCESS EXCLUSIVE` and rewrites the entire table, just like `VACUUM FULL` — and PostgreSQL does not keep the rows clustered as you continue to write. Use `pg_repack --order-by` for online clustering, or build an index in the order you actually want to read.",
    },
  },
  create(context) {
    return {
      ClusterStmt(node: ClusterStmt) {
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noCluster",
        });
      },
    };
  },
};

export default rule;
