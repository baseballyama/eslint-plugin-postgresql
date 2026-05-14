import type { Rule } from "eslint";

type Style = "always" | "never";

const DEFAULT_STYLE: Style = "always";

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
        "Enforce a consistent stance on `CONCURRENTLY` for `REINDEX` (either always require it, or always forbid it)",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [
      {
        type: "object",
        properties: {
          style: { enum: ["always", "never"] },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferReindexConcurrently:
        "`REINDEX` without `CONCURRENTLY` takes a `SHARE` lock (table) or `ACCESS EXCLUSIVE` (index), blocking writers for the rebuild. Use `REINDEX (TABLE|INDEX) CONCURRENTLY ...` (PG ≥ 12) so writers keep working.",
      unexpectedReindexConcurrently:
        "Avoid `REINDEX CONCURRENTLY`. Concurrent reindex cannot run inside a transaction; use plain `REINDEX` when the migration tool wraps each step in BEGIN/COMMIT.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { style?: Style };
    const style: Style = option.style ?? DEFAULT_STYLE;
    return {
      ReindexStmt(node: ReindexStmt) {
        const concurrent = isConcurrent(node.params);
        if (style === "always" && !concurrent) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "preferReindexConcurrently",
          });
          return;
        }
        if (style === "never" && concurrent) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "unexpectedReindexConcurrently",
          });
        }
      },
    };
  },
};

export default rule;
