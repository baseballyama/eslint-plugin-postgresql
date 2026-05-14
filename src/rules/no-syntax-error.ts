import type { Rule } from "eslint";

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
      // The parser's Program node carries SQLStatementNode | SQLParseError
      // children, but ESLint's visitor type is the estree Program. Accept the
      // ESLint shape and re-narrow each statement individually.
      Program(node) {
        const body = (node as { body?: unknown }).body;
        if (!Array.isArray(body)) return;
        for (const stmt of body) {
          if (
            stmt != null &&
            typeof stmt === "object" &&
            (stmt as { type?: unknown }).type === "SQLParseError"
          ) {
            const parseError = stmt as { error?: unknown };
            const errorMessage =
              typeof parseError.error === "string"
                ? parseError.error
                : "Unknown SQL parsing error";
            context.report({
              node: stmt as unknown as Rule.Node,
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
