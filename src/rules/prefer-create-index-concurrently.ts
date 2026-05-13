import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer `CREATE INDEX CONCURRENTLY` to avoid blocking writes against the table during migrations",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      preferConcurrently:
        "Use `CREATE INDEX CONCURRENTLY`. A plain `CREATE INDEX` takes a `SHARE` lock on the target table for the duration of the build — readers are unaffected, but every writer is blocked. Concurrent index builds cannot run inside a transaction, so a migration tool that wraps each step in BEGIN/COMMIT needs an explicit opt-out here.",
    },
  },
  create(context) {
    return {
      IndexStmt(node: any) {
        if (!node.concurrent) {
          context.report({ node, messageId: "preferConcurrently" });
        }
      },
    };
  },
};

export default rule;
