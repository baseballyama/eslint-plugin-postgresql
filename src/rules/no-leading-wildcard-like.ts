import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const getStringConst = (node: unknown): string | undefined => {
  if (typeof node !== "object" || node === null) return undefined;
  const n = node as { type?: unknown; sval?: { sval?: unknown } };
  if (n.type !== "A_Const") return undefined;
  const sval = n.sval?.sval;
  return typeof sval === "string" ? sval : undefined;
};

const isLikeKind = (kind: unknown): boolean =>
  kind === "AEXPR_LIKE" || kind === "AEXPR_ILIKE";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `LIKE`/`ILIKE` patterns that begin with `%` because they cannot use a B-tree index and force a full scan",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noLeadingWildcardLike:
        "`LIKE`/`ILIKE` patterns that begin with `%` cannot use a B-tree index and force a sequential scan. If you need substring search, use a `pg_trgm` GIN index, full-text search, or rework the schema so the prefix is indexable.",
    },
  },
  create(context) {
    return {
      A_Expr(node: Ast.A_Expr) {
        if (!isLikeKind(node.kind)) return;
        const pattern = getStringConst(node.rexpr);
        if (typeof pattern !== "string") return;
        if (!pattern.startsWith("%")) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noLeadingWildcardLike",
        });
      },
    };
  },
};

export default rule;
