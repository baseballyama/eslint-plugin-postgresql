import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { getTypeName } from "../utils/ast.js";

type Style = "always" | "never";

const DEFAULT_STYLE: Style = "always";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce a consistent stance on `text` vs `varchar(n)` for string columns",
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
      preferText:
        "Use `text` instead of `varchar(n)`. PostgreSQL stores both the same way; the length cap is enforced by a constraint that you cannot relax without a full table rewrite. Move the limit into a CHECK constraint.",
      unexpectedText:
        "Use `varchar(n)` (or another bounded string type) instead of `text`. Useful for projects that intentionally cap every string column's length at the type level.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { style?: Style };
    const style: Style = option.style ?? DEFAULT_STYLE;
    return {
      ColumnDef(node: Ast.ColumnDef) {
        const typeName = node.typeName;
        const name = getTypeName(typeName);
        // `typmods` lives behind the parser's index signature on the
        // `names` variant of typeName; reach it via bracket notation.
        const typmods =
          typeName != null && typeof typeName === "object"
            ? (typeName as Record<string, unknown>)["typmods"]
            : undefined;
        if (
          style === "always" &&
          name === "varchar" &&
          Array.isArray(typmods)
        ) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "preferText",
          });
          return;
        }
        if (style === "never" && name === "text") {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "unexpectedText",
          });
        }
      },
    };
  },
};

export default rule;
