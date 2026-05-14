import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { getTypeName } from "../utils/ast.js";

const hasTypmods = (typeName: unknown): boolean => {
  if (typeof typeName !== "object" || typeName === null) return false;
  const mods = (typeName as { typmods?: unknown }).typmods;
  return Array.isArray(mods) && mods.length > 0;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require an explicit precision (and scale) on `NUMERIC` / `DECIMAL` columns",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noNumericWithoutPrecision:
        "`NUMERIC` / `DECIMAL` without precision accepts unbounded magnitude and rejects nothing — it's a missed opportunity to encode the column's domain. Declare `NUMERIC(precision, scale)`.",
    },
  },
  create(context) {
    return {
      ColumnDef(node: Ast.ColumnDef) {
        if (getTypeName(node.typeName) !== "numeric") return;
        if (hasTypmods(node.typeName)) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noNumericWithoutPrecision",
        });
      },
    };
  },
};

export default rule;
