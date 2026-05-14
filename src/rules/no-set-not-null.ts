import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `ALTER COLUMN ... SET NOT NULL` because it scans the whole table under ACCESS EXCLUSIVE",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noSetNotNull:
        "`SET NOT NULL` scans the whole table for nulls under an `ACCESS EXCLUSIVE` lock. The safe pattern in production is to add a `CHECK (col IS NOT NULL) NOT VALID` constraint, `VALIDATE CONSTRAINT` separately, then `SET NOT NULL` (PG ≥ 12 reuses the validated CHECK and skips the scan).",
    },
  },
  create(context) {
    return {
      AlterTableCmd(node: Ast.AlterTableCmd) {
        if (node.subtype !== "AT_SetNotNull") return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noSetNotNull",
        });
      },
    };
  },
};

export default rule;
