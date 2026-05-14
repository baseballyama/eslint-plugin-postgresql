import type { Rule } from "eslint";

interface DefElem {
  type: "DefElem";
  defname?: string;
}

interface ReindexStmt {
  type: "ReindexStmt";
  params?: DefElem[];
}

const isConcurrent = (params: ReindexStmt["params"]): boolean => {
  if (!Array.isArray(params)) return false;
  return params.some(
    (p) => p && p.type === "DefElem" && p.defname === "concurrently",
  );
};

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require `REINDEX` to use `CONCURRENTLY`; a non-concurrent REINDEX locks the table for writes",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      preferReindexConcurrently:
        "`REINDEX` without `CONCURRENTLY` takes a `SHARE` lock (table) or `ACCESS EXCLUSIVE` (index), blocking writers for the rebuild. Use `REINDEX (TABLE|INDEX) CONCURRENTLY ...` (PG ≥ 12) so writers keep working.",
    },
  },
  create(context) {
    return {
      ReindexStmt(node: ReindexStmt) {
        if (isConcurrent(node.params)) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "preferReindexConcurrently",
        });
      },
    };
  },
};

export default rule;
