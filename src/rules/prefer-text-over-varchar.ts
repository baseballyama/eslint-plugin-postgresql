import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { getTypeName } from "../utils/ast.js";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer `text` over `varchar(n)`; a length limit belongs in a CHECK constraint, not the type",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      preferText:
        "Use `text` instead of `varchar(n)`. PostgreSQL stores both the same way; the length cap is enforced by a constraint that you cannot relax without a full table rewrite. Move the limit into a CHECK constraint.",
    },
  },
  create(context) {
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
        if (name === "varchar" && Array.isArray(typmods)) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "preferText",
          });
        }
      },
    };
  },
};

export default rule;
