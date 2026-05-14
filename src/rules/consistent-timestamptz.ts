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
        "Enforce a consistent stance on `timestamptz` vs `timestamp` (without time zone)",
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
      preferTimestamptz:
        "Use `timestamptz` (or `TIMESTAMP WITH TIME ZONE`) instead of `timestamp`. `timestamp` is timezone-naive: it stores the wall-clock value you handed in and assumes every reader and writer share the same convention, so two clients on different `TimeZone` settings will disagree on which instant the row represents.",
      unexpectedTimestamptz:
        "Use `timestamp` instead of `timestamptz` (or `TIMESTAMP WITH TIME ZONE`). When the project treats every timestamp as UTC at the application layer, `timestamp` avoids the implicit conversions `timestamptz` performs against each session's `TimeZone` setting.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { style?: Style };
    const style: Style = option.style ?? DEFAULT_STYLE;

    return {
      ColumnDef(node: Ast.ColumnDef) {
        const typeName = getTypeName(node.typeName);
        if (style === "always" && typeName === "timestamp") {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "preferTimestamptz",
          });
          return;
        }
        if (style === "never" && typeName === "timestamptz") {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "unexpectedTimestamptz",
          });
        }
      },
    };
  },
};

export default rule;
