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
        "Disallow `ALTER TABLE ... RENAME COLUMN` — every deployed reader of the old name breaks at deploy time",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noRenameColumn:
        "`RENAME COLUMN` breaks every running app that still selects/inserts by the old name. The safer pattern is to add a new column, dual-write, backfill, and drop the old one across separate deploys.",
    },
  },
  create(context) {
    return {
      RenameStmt(node: RenameStmtNode) {
        if (node.renameType !== "OBJECT_COLUMN") return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noRenameColumn",
        });
      },
    };
  },
};

export default rule;
