import type { Rule } from "eslint";

interface DropdbStmt {
  type: "DropdbStmt";
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `DROP DATABASE`; it is catastrophic if run by accident and should not live in versioned SQL",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noDropDatabase:
        "`DROP DATABASE` is catastrophic and irreversible. Database creation/deletion belongs in an explicit operator workflow, not in versioned SQL applied automatically by a migration tool.",
    },
  },
  create(context) {
    return {
      DropdbStmt(node: DropdbStmt) {
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noDropDatabase",
        });
      },
    };
  },
};

export default rule;
