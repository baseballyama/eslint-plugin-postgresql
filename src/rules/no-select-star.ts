import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `SELECT *` in queries to keep result schemas stable when the underlying table changes",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noSelectStar:
        "Avoid `SELECT *`; list the columns you need so the result schema does not silently change when the table does.",
    },
  },
  create(context) {
    return {
      SelectStmt(node: any) {
        const targetList = node.targetList;
        if (!Array.isArray(targetList)) return;
        for (const target of targetList) {
          const val = target?.val;
          if (
            val &&
            val.type === "ColumnRef" &&
            Array.isArray(val.fields) &&
            val.fields.some((f: any) => f && f.type === "A_Star")
          ) {
            context.report({ node: target, messageId: "noSelectStar" });
          }
        }
      },
    };
  },
};

export default rule;
