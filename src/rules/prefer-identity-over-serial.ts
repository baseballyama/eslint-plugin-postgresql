import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { getTypeName } from "../utils/ast.js";

const SERIAL_TYPES = new Set(["smallserial", "serial", "bigserial"]);

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer `GENERATED ... AS IDENTITY` over `SERIAL` / `BIGSERIAL` / `SMALLSERIAL`",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      preferIdentity:
        "Use `GENERATED ALWAYS AS IDENTITY` (SQL standard) instead of `{{type}}`. The serial pseudo-types create a separately-owned sequence that breaks under pg_dump round-trips and does not honor column privileges.",
    },
  },
  create(context) {
    return {
      ColumnDef(node: Ast.ColumnDef) {
        const t = getTypeName(node.typeName);
        if (t && SERIAL_TYPES.has(t)) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "preferIdentity",
            data: { type: t },
          });
        }
      },
    };
  },
};

export default rule;
