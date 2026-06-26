import type { Rule } from "eslint";

interface VariableSetStmt {
  type: "VariableSetStmt";
  name?: string;
}

interface DefElem {
  defname?: string;
  arg?: unknown;
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
    // A `SET search_path` clause that is part of a function definition
    // (`CREATE FUNCTION ... SET search_path = ...`, `CREATE PROCEDURE ... SET
    // search_path = ...`, or `ALTER FUNCTION ... SET search_path = ...`) is NOT
    // the session-mutating foot-gun this rule targets. It is the documented
    // mitigation for `search_path` injection and is *required* by the sibling
    // rule `no-security-definer-without-search-path`. Flagging it makes the two
    // recommended rules mutually unsatisfiable for `SECURITY DEFINER` functions.
    //
    // Such a clause parses as a `VariableSetStmt` nested under a `set` defElem in
    // the function's `options` (CREATE) or `actions` (ALTER). We record those
    // nodes up front and skip them, so only standalone `SET search_path`
    // statements remain reportable. A parent node is always visited before its
    // children, so the set is recorded before its `VariableSetStmt` is reached.
    const functionScopedSets = new WeakSet<object>();
    const collectFunctionSets = (clauses: unknown): void => {
      if (!Array.isArray(clauses)) return;
      for (const clause of clauses as DefElem[]) {
        if (
          clause?.defname === "set" &&
          clause.arg !== null &&
          typeof clause.arg === "object"
        ) {
          functionScopedSets.add(clause.arg as object);
        }
      }
    };

    return {
      CreateFunctionStmt(node: { options?: unknown }) {
        collectFunctionSets(node.options);
      },
      AlterFunctionStmt(node: { actions?: unknown }) {
        collectFunctionSets(node.actions);
      },
      VariableSetStmt(node: VariableSetStmt) {
        if (node.name !== "search_path") return;
        if (functionScopedSets.has(node as unknown as object)) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noSetSearchPath",
        });
      },
    };
  },
};

export default rule;
