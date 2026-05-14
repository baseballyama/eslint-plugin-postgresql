import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `CREATE UNLOGGED TABLE` because unlogged tables are truncated on crash and not replicated",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noUnloggedTable:
        "`UNLOGGED` tables skip WAL: they are truncated on crash, not replicated to standbys, and not restored from base backups. If a cache table is what you want, document it explicitly and disable this rule for that file.",
    },
  },
  create(context) {
    return {
      CreateStmt(node: Ast.CreateStmt) {
        const relation = node.relation as
          | (Ast.RangeVar & { relpersistence?: string })
          | undefined;
        if (relation?.relpersistence !== "u") return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noUnloggedTable",
        });
      },
    };
  },
};

export default rule;
