import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { getTypeName } from "../utils/ast.js";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer `timestamptz` (`TIMESTAMP WITH TIME ZONE`) over `timestamp` (without time zone)",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      preferTimestamptz:
        "Use `timestamptz` (or `TIMESTAMP WITH TIME ZONE`) instead of `timestamp`. `timestamp` is timezone-naive: it stores the wall-clock value you handed in and assumes every reader and writer share the same convention, so two clients on different `TimeZone` settings will disagree on which instant the row represents.",
    },
  },
  create(context) {
    return {
      ColumnDef(node: Ast.ColumnDef) {
        if (getTypeName(node.typeName) === "timestamp") {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "preferTimestamptz",
          });
        }
      },
    };
  },
};

export default rule;
