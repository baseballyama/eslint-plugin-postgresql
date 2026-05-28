import type { Rule } from "eslint";

type Style = "always" | "never";

const DEFAULT_STYLE: Style = "always";

interface Tokenish {
  type?: string;
  value: string;
  range: [number, number];
  loc: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce a consistent stance on `CREATE OR REPLACE` for `FUNCTION` / `PROCEDURE` / `VIEW` (either always require it, or always forbid it)",
      category: "Best Practices",
      recommended: false,
    },
    // No autofix on purpose. Adding `OR REPLACE` turns a guard
    // ("error if object already exists") into an in-place overwrite;
    // removing it does the reverse. Both are runtime-semantics
    // changes that the linter must not make on the author's behalf.
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
      preferOrReplace:
        "Use `CREATE OR REPLACE {{kind}}` so re-running this migration does not abort with `relation already exists`.",
      unexpectedOrReplace:
        "Avoid `CREATE OR REPLACE {{kind}}`; drop and re-create the object explicitly so unintended overwrites are surfaced.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { style?: Style };
    const style: Style = option.style ?? DEFAULT_STYLE;

    // The parser sometimes emits `[0, 0]` for the first top-level
    // statement's range, so node.range can't be used to find the
    // CREATE keyword. Track a per-file token cursor advanced past
    // each CREATE we visit; visitor calls fire in body order so this
    // stays in lock-step with the AST.
    let cursor = 0;
    const advanceToNextCreate = (
      tokens: readonly Tokenish[],
    ): { createIdx: number } | null => {
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i]!.range[0] < cursor) continue;
        if (
          tokens[i]!.type === "Keyword" &&
          tokens[i]!.value.toUpperCase() === "CREATE"
        ) {
          return { createIdx: i };
        }
      }
      return null;
    };

    const visit = (
      node: { replace?: unknown; is_procedure?: unknown },
      kindFromNode: "FUNCTION" | "VIEW",
    ): void => {
      const tokens = (context.sourceCode.ast.tokens ?? []) as Tokenish[];
      const found = advanceToNextCreate(tokens);
      if (!found) return;
      const create = tokens[found.createIdx]!;
      cursor = create.range[1];
      const hasOrReplace = node.replace === true;
      const kind: string =
        kindFromNode === "FUNCTION" && node.is_procedure === true
          ? "PROCEDURE"
          : kindFromNode;

      if (style === "always" && !hasOrReplace) {
        context.report({
          loc: create.loc,
          messageId: "preferOrReplace",
          data: { kind },
        });
        return;
      }

      if (style === "never" && hasOrReplace) {
        context.report({
          loc: create.loc,
          messageId: "unexpectedOrReplace",
          data: { kind },
        });
      }
    };
    return {
      CreateFunctionStmt: (n: { replace?: unknown; is_procedure?: unknown }) =>
        visit(n, "FUNCTION"),
      ViewStmt: (n: { replace?: unknown }) => visit(n, "VIEW"),
    };
  },
};

export default rule;
