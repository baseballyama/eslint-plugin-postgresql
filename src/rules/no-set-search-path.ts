import type { Rule } from "eslint";

interface VariableSetStmt {
  type: "VariableSetStmt";
  name?: string;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `SET search_path = ...` in versioned SQL; qualify identifiers with their schema instead",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noSetSearchPath:
        "`SET search_path` makes name resolution depend on session state and is a known foot-gun for security-definer functions and CREATE statements. Qualify identifiers with their schema (`audit.events`, `public.users`) instead.",
    },
  },
  create(context) {
    return {
      VariableSetStmt(node: VariableSetStmt) {
        if (node.name !== "search_path") return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noSetSearchPath",
        });
      },
    };
  },
};

export default rule;
