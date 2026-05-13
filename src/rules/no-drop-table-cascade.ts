import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `DROP TABLE ... CASCADE` because it silently removes dependent objects",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noCascade:
        "Avoid `DROP TABLE ... CASCADE`. CASCADE silently removes dependent objects (views, foreign keys, sequences); list them explicitly so reviewers can see the blast radius.",
    },
  },
  create(context) {
    return {
      DropStmt(node: any) {
        // Scope to DROP TABLE only — the rule name promises that. Other DROP
        // ... CASCADE variants (schema, type, etc.) can be added as separate
        // rules if needed.
        if (
          node.behavior === "DROP_CASCADE" &&
          node.removeType === "OBJECT_TABLE"
        ) {
          context.report({ node, messageId: "noCascade" });
        }
      },
    };
  },
};

export default rule;
