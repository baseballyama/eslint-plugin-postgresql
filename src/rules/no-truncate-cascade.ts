import type { Rule } from "eslint";
import type { TruncateStmt } from "../utils/ast.js";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `TRUNCATE ... CASCADE` because it transitively empties referencing tables",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noCascade:
        "`TRUNCATE ... CASCADE` also truncates every table that has a foreign key referencing this one. List the dependent tables explicitly so reviewers can see what gets emptied.",
    },
  },
  create(context) {
    return {
      TruncateStmt(node: TruncateStmt) {
        if (node.behavior === "DROP_CASCADE") {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "noCascade",
          });
        }
      },
    };
  },
};

export default rule;
