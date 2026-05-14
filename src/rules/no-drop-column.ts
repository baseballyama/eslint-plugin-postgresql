import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `ALTER TABLE ... DROP COLUMN` — every reader of the dropped column breaks at deploy time",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noDropColumn:
        "`DROP COLUMN` breaks every running app that still references the column. Roll it out as a two-step migration: stop reading the column in the application, deploy, then drop it in a follow-up release.",
    },
  },
  create(context) {
    return {
      AlterTableCmd(node: Ast.AlterTableCmd) {
        if (node.subtype !== "AT_DropColumn") return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noDropColumn",
        });
      },
    };
  },
};

export default rule;
