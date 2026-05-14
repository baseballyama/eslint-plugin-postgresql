import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `ALTER TABLE ... ALTER COLUMN ... TYPE ...` because it can rewrite the table under an ACCESS EXCLUSIVE lock",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noAlterColumnType:
        "`ALTER COLUMN ... TYPE` can rewrite the entire table under an ACCESS EXCLUSIVE lock. For non-trivial tables, add a new column, dual-write, backfill, and swap — or use `USING` only for known-safe conversions in a separate migration.",
    },
  },
  create(context) {
    return {
      AlterTableCmd(node: Ast.AlterTableCmd) {
        if (node.subtype !== "AT_AlterColumnType") return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noAlterColumnType",
        });
      },
    };
  },
};

export default rule;
