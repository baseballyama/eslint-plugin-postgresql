import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

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
    schema: [
      {
        type: "object",
        properties: {
          allow: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      notSnakeCase:
        "Column name `{{name}}` is not snake_case. PostgreSQL preserves the case of quoted identifiers; using a mixed-case quoted name forces every consumer to quote-match it.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { allow?: string[] };
    const allow = new Set(option.allow ?? []);
    return {
      ColumnDef(node: Ast.ColumnDef) {
        const name = node.colname;
        if (typeof name !== "string") return;
        if (allow.has(name)) return;
        if (SNAKE_CASE.test(name)) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "notSnakeCase",
          data: { name },
        });
      },
    };
  },
};

export default rule;
