import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `ALTER COLUMN ... DROP NOT NULL` — relaxing a NOT NULL constraint surprises every consumer that already assumes the column is non-null",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noDropNotNull:
        "`DROP NOT NULL` lets the column store NULLs again — every consumer that already assumes the column is non-null (joins, COALESCE coverage, app-level types) silently breaks. If a row genuinely needs no value, model it with a sentinel or a separate optional table.",
    },
  },
  create(context) {
    return {
      AlterTableCmd(node: Ast.AlterTableCmd) {
        if (node.subtype !== "AT_DropNotNull") return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noDropNotNull",
        });
      },
    };
  },
};

export default rule;
