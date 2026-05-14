import type { Rule } from "eslint";

interface RenameStmtNode {
  type: "RenameStmt";
  renameType?: string;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `ALTER TABLE ... RENAME TO` — every deployed reader of the old name breaks at deploy time",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noRenameTable:
        "`RENAME TO` breaks every running app that still queries the old name. The safer pattern is `CREATE VIEW old AS SELECT * FROM new` so old callers keep working until they're migrated, then drop the view in a separate deploy.",
    },
  },
  create(context) {
    return {
      RenameStmt(node: RenameStmtNode) {
        if (node.renameType !== "OBJECT_TABLE") return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noRenameTable",
        });
      },
    };
  },
};

export default rule;
