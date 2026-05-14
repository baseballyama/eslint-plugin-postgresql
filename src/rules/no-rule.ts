import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `CREATE RULE`; PostgreSQL's rule system is a known foot-gun and is effectively deprecated in favor of triggers and views",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noRule:
        "Avoid `CREATE RULE`. PostgreSQL's rule system has surprising semantics around row counts, RETURNING, and updatable views; use a trigger or an updatable view instead.",
    },
  },
  create(context) {
    return {
      // The runtime AST tags this node as "RuleStmt" even though the
      // upstream type alias is `CreateRuleStmt` — visit by the runtime
      // name; the upstream typings will be reconciled separately.
      RuleStmt(node: { range?: [number, number] }) {
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noRule",
        });
      },
    };
  },
};

export default rule;
