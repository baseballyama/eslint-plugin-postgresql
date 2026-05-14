import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `CREATE TEMPORARY TABLE` in versioned SQL — temp tables exist for the session only and rarely belong in migration files",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noTemporaryTable:
        "`TEMPORARY` tables exist only for the current session, so they almost never belong in versioned SQL. If you need session-scoped scratch storage, build it from application code; if you mean a persistent table, drop the `TEMP/TEMPORARY` qualifier.",
    },
  },
  create(context) {
    return {
      CreateStmt(node: Ast.CreateStmt) {
        const relation = node.relation as
          | (Ast.RangeVar & { relpersistence?: string })
          | undefined;
        if (relation?.relpersistence !== "t") return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noTemporaryTable",
        });
      },
    };
  },
};

export default rule;
