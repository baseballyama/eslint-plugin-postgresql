import type { Rule } from "eslint";

// NOTE: Currently using basic syntax validation due to module loading issues with postgresql-eslint-parser
// TODO: Replace with proper postgresql-eslint-parser when the libpg-query import issue is resolved
// import postgresqlParser from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow PostgreSQL syntax errors",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      syntaxError: "PostgreSQL syntax error: {{message}}",
    },
  },
  create(context) {
    return {
      Program(node: any) {
        for (const stmt of node.body) {
          if (stmt.type === "SQLParseError") {
            const errorMessage = stmt.error || "Unknown SQL parsing error";
            context.report({
              node: stmt,
              messageId: "syntaxError",
              data: { message: errorMessage },
            });
          }
        }
      },
    };
  },
};

export default rule;
