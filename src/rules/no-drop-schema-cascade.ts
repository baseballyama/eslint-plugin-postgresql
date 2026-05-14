import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `DROP SCHEMA ... CASCADE`; it silently removes every object in the schema",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noDropSchemaCascade:
        "`DROP SCHEMA ... CASCADE` removes every table, view, function, and sequence in the schema with no preview. List the objects you actually want to drop instead, or drop the schema only when it's already empty.",
    },
  },
  create(context) {
    return {
      DropStmt(node: Ast.DropStmt) {
        if (node.removeType !== "OBJECT_SCHEMA") return;
        if (node.behavior !== "DROP_CASCADE") return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noDropSchemaCascade",
        });
      },
    };
  },
};

export default rule;
