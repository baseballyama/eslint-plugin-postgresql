import type { Rule } from "eslint";

const SNAKE_CASE = /^[a-z][a-z0-9_]*$/;

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require column names to be snake_case",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      notSnakeCase:
        "Column name `{{name}}` is not snake_case. PostgreSQL preserves the case of quoted identifiers; using a mixed-case quoted name forces every consumer to quote-match it.",
    },
  },
  create(context) {
    return {
      ColumnDef(node: any) {
        const name = node?.colname;
        if (typeof name === "string" && !SNAKE_CASE.test(name)) {
          context.report({
            node,
            messageId: "notSnakeCase",
            data: { name },
          });
        }
      },
    };
  },
};

export default rule;
