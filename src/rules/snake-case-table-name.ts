import type { Rule } from "eslint";

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
    const checkRelation = (relation: any, node: any) => {
      const name = relation?.relname;
      if (typeof name === "string" && !SNAKE_CASE.test(name)) {
        context.report({
          node,
          messageId: "notSnakeCase",
          data: { name },
        });
      }
    };
    return {
      CreateStmt(node: any) {
        checkRelation(node?.relation, node);
      },
    };
  },
};

export default rule;
