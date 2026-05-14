import type { Rule } from "eslint";

interface NullTestNode {
  type: "NullTest";
  arg: unknown;
  nulltesttype: "IS_NULL" | "IS_NOT_NULL";
}

interface CaseWhenNode {
  type: "CaseWhen";
  expr: unknown;
  result: unknown;
}

interface CaseExprNode {
  type: "CaseExpr";
  arg?: unknown;
  args?: CaseWhenNode[];
  defresult?: unknown;
}

const NOISE_KEYS = new Set(["parent", "loc", "range"]);

const sameNode = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => sameNode(v, b[i]));
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const ak = Object.keys(ao).filter((k) => !NOISE_KEYS.has(k));
  const bk = Object.keys(bo).filter((k) => !NOISE_KEYS.has(k));
  if (ak.length !== bk.length) return false;
  return ak.every((k) => sameNode(ao[k], bo[k]));
};

const isNullTest = (
  node: unknown,
  kind: "IS_NULL" | "IS_NOT_NULL",
): node is NullTestNode => {
  if (typeof node !== "object" || node === null) return false;
  const n = node as { type?: unknown; nulltesttype?: unknown };
  return n.type === "NullTest" && n.nulltesttype === kind;
};

const isCoalesceShape = (node: CaseExprNode): boolean => {
  // Only the searched `CASE WHEN ... END` form (no `CASE expr WHEN ...`)
  // collapses to COALESCE.
  if (node.arg !== undefined) return false;
  const args = node.args;
  if (!Array.isArray(args) || args.length !== 1) return false;
  const branch = args[0];
  if (!branch) return false;
  const expr = branch.expr;
  if (node.defresult === undefined) return false;

  // CASE WHEN x IS NULL THEN y ELSE x END  →  COALESCE(x, y)
  if (
    isNullTest(expr, "IS_NULL") &&
    sameNode(expr.arg, node.defresult) &&
    !sameNode(expr.arg, branch.result)
  ) {
    return true;
  }
  // CASE WHEN x IS NOT NULL THEN x ELSE y END  →  COALESCE(x, y)
  if (
    isNullTest(expr, "IS_NOT_NULL") &&
    sameNode(expr.arg, branch.result) &&
    !sameNode(expr.arg, node.defresult)
  ) {
    return true;
  }
  return false;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer `COALESCE(x, y)` over `CASE WHEN x IS NULL THEN y ELSE x END` (and its IS NOT NULL mirror)",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      preferCoalesceOverCase:
        "`CASE WHEN ... IS NULL THEN ... ELSE ... END` is a verbose `COALESCE`. Use `COALESCE(x, fallback)` instead.",
    },
  },
  create(context) {
    return {
      CaseExpr(node: CaseExprNode) {
        if (!isCoalesceShape(node)) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "preferCoalesceOverCase",
        });
      },
    };
  },
};

export default rule;
