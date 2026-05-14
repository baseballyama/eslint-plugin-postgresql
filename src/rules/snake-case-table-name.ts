import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const SNAKE_CASE = /^[a-z][a-z0-9_]*$/;

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require table names to be snake_case",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      notSnakeCase:
        'Table name `{{name}}` is not snake_case. PostgreSQL folds unquoted identifiers to lower case but preserves the case of quoted identifiers; mixing the two leads to `relation "BadName" does not exist` errors that are confusing to debug.',
    },
  },
  create(context) {
    return {
      CreateStmt(node: Ast.CreateStmt) {
        const relation = node.relation as { relname?: unknown } | undefined;
        const name = relation?.relname;
        if (typeof name === "string" && !SNAKE_CASE.test(name)) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "notSnakeCase",
            data: { name },
          });
        }
      },
    };
  },
};

export default rule;
