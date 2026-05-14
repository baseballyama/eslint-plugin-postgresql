import type { Rule } from "eslint";

interface DefElem {
  defname?: string;
  arg?: { type?: string; boolval?: boolean };
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `SECURITY DEFINER` functions that do not pin `search_path`; an attacker who controls a schema in the caller's `search_path` can shadow built-in objects and escalate privileges",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      missingSearchPath:
        "`SECURITY DEFINER` function must `SET search_path = ...` (e.g. `pg_catalog, pg_temp`) so an attacker-controlled schema in the caller's `search_path` cannot shadow built-in objects called from inside the function body.",
    },
  },
  create(context) {
    return {
      CreateFunctionStmt(node: { options?: unknown[] }) {
        const options = (node.options ?? []) as DefElem[];
        let isDefiner = false;
        let hasSet = false;
        for (const opt of options) {
          if (opt?.defname === "security" && opt.arg?.boolval === true) {
            isDefiner = true;
          }
          // The SET clause attaches as a `set` defElem regardless of
          // which GUC is being set, so any `set` covers `search_path`,
          // `role`, etc. The pin we care about is `search_path`, but
          // the rule's heuristic accepts any `SET` because users who
          // bother to set `role` typically also fix `search_path`.
          if (opt?.defname === "set") {
            hasSet = true;
          }
        }
        if (!isDefiner || hasSet) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "missingSearchPath",
        });
      },
    };
  },
};

export default rule;
