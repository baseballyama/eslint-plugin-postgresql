import type { Rule } from "eslint";

const NULL_OPS = new Set(["=", "<>", "!="]);

const isNullConst = (node: unknown): boolean => {
  if (!node || typeof node !== "object") return false;
  const n = node as { type?: unknown; isnull?: unknown };
  return n.type === "A_Const" && n.isnull === true;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `x = NULL` / `x <> NULL`; PostgreSQL's three-valued logic makes both expressions evaluate to NULL (i.e. neither true nor false), which silently filters away rows the author probably wanted",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      useIsNull:
        "`{{op}} NULL` always evaluates to NULL (treated as false). Use `IS NULL` / `IS NOT NULL` instead.",
    },
  },
  create(context) {
    return {
      A_Expr(node: {
        kind?: unknown;
        name?: unknown;
        lexpr?: unknown;
        rexpr?: unknown;
      }) {
        if (node.kind !== "AEXPR_OP") return;
        if (!Array.isArray(node.name) || node.name.length !== 1) return;
        const op = (node.name[0] as { sval?: unknown }).sval;
        if (typeof op !== "string" || !NULL_OPS.has(op)) return;
        if (!isNullConst(node.lexpr) && !isNullConst(node.rexpr)) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "useIsNull",
          data: { op },
        });
      },
    };
  },
};

export default rule;
