import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const isIntegerConst = (node: unknown): boolean => {
  if (typeof node !== "object" || node === null) return false;
  const n = node as { type?: unknown; ival?: unknown };
  return n.type === "A_Const" && typeof n.ival === "object" && n.ival !== null;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `ORDER BY <position>` (positional/ordinal references); use the column name or alias instead",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noOrderByOrdinal:
        "`ORDER BY <position>` silently breaks when the SELECT list changes. Use the column name or alias instead.",
    },
  },
  create(context) {
    return {
      SelectStmt(node: Ast.SelectStmt) {
        const sortClause = node.sortClause;
        if (!Array.isArray(sortClause)) return;
        for (const sortBy of sortClause) {
          if (!sortBy || sortBy.type !== "SortBy") continue;
          if (isIntegerConst(sortBy.node)) {
            context.report({
              node: sortBy as unknown as Rule.Node,
              messageId: "noOrderByOrdinal",
            });
          }
        }
      },
    };
  },
};

export default rule;
