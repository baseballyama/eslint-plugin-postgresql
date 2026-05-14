import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { getTypeName, isConstraint } from "../utils/ast.js";

type Style = "always" | "never";

const DEFAULT_STYLE: Style = "always";

const SERIAL_TYPES = new Set(["smallserial", "serial", "bigserial"]);

const hasIdentity = (col: Ast.ColumnDef): boolean => {
  const constraints = col.constraints;
  if (!Array.isArray(constraints)) return false;
  return constraints.some(
    (c) => isConstraint(c) && c.contype === "CONSTR_IDENTITY",
  );
};

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce a consistent stance on `GENERATED ... AS IDENTITY` vs `SERIAL` / `BIGSERIAL` / `SMALLSERIAL`",
      category: "Best Practices",
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
      preferIdentity:
        "Use `GENERATED ALWAYS AS IDENTITY` (SQL standard) instead of `{{type}}`. The serial pseudo-types create a separately-owned sequence that breaks under pg_dump round-trips and does not honor column privileges.",
      unexpectedIdentity:
        "Use a serial pseudo-type (e.g. `bigserial`) instead of `GENERATED ... AS IDENTITY`. Useful for projects that need to keep compatibility with tooling that does not understand identity columns.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { style?: Style };
    const style: Style = option.style ?? DEFAULT_STYLE;
    return {
      ColumnDef(node: Ast.ColumnDef) {
        const t = getTypeName(node.typeName);
        if (style === "always" && t && SERIAL_TYPES.has(t)) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "preferIdentity",
            data: { type: t },
          });
          return;
        }
        if (style === "never" && hasIdentity(node)) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "unexpectedIdentity",
          });
        }
      },
    };
  },
};

export default rule;
