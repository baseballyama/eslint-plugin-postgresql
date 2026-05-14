import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

type Style = "always" | "never";

const DEFAULT_STYLE: Style = "always";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce a consistent stance on `CONCURRENTLY` for `CREATE INDEX` (either always require it, or always forbid it)",
      category: "Best Practices",
      recommended: false,
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
      preferConcurrently:
        "Use `CREATE INDEX CONCURRENTLY`. A plain `CREATE INDEX` takes a `SHARE` lock on the target table for the duration of the build — readers are unaffected, but every writer is blocked. Concurrent index builds cannot run inside a transaction, so a migration tool that wraps each step in BEGIN/COMMIT needs an explicit opt-out here.",
      unexpectedConcurrently:
        "Avoid `CREATE INDEX CONCURRENTLY`. Concurrent index builds cannot run inside a transaction, so they conflict with migration tools that wrap each step in BEGIN/COMMIT; drop the keyword and use a plain `CREATE INDEX`.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { style?: Style };
    const style: Style = option.style ?? DEFAULT_STYLE;

    return {
      IndexStmt(node: Ast.IndexStmtPG) {
        const hasConcurrently = node["concurrent"] === true;
        if (style === "always" && !hasConcurrently) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "preferConcurrently",
          });
          return;
        }
        if (style === "never" && hasConcurrently) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "unexpectedConcurrently",
          });
        }
      },
    };
  },
};

export default rule;
