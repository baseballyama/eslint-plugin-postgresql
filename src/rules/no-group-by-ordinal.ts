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
        "Disallow `GROUP BY <position>` (positional/ordinal references); use the column name or expression instead",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noGroupByOrdinal:
        "`GROUP BY <position>` silently breaks when the SELECT list changes. Use the column name or the expression itself.",
    },
  },
  create(context) {
    return {
      SelectStmt(node: Ast.SelectStmt) {
        const groupClause = node.groupClause;
        if (!Array.isArray(groupClause)) return;
        for (const expr of groupClause) {
          if (isIntegerConst(expr)) {
            context.report({
              node: expr as unknown as Rule.Node,
              messageId: "noGroupByOrdinal",
            });
          }
        }
      },
    };
  },
};

export default rule;
