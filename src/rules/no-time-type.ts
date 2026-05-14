import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { getTypeName } from "../utils/ast.js";

const TIME_TYPES = new Set(["time", "timetz"]);

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `TIME` / `TIME WITH TIME ZONE` columns; they rarely model a real-world value correctly",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noTimeType:
        "`TIME` and `TIME WITH TIME ZONE` rarely model anything correctly: `time` has no date so cannot disambiguate around DST, and `timetz` stores an offset that is meaningless without a date. Use `timestamptz` for points in time, `interval` for durations, or store an opaque `text` if all you need is a display value.",
    },
  },
  create(context) {
    return {
      ColumnDef(node: Ast.ColumnDef) {
        const t = getTypeName(node.typeName);
        if (typeof t !== "string") return;
        if (!TIME_TYPES.has(t)) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noTimeType",
        });
      },
    };
  },
};

export default rule;
