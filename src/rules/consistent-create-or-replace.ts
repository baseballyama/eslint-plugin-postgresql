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
    fixable: "code",
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
          fix: (fixer) =>
            fixer.insertTextAfterRange(create.range, " OR REPLACE"),
        });
        return;
      }

      if (style === "never" && hasOrReplace) {
        // Locate the `OR` and `REPLACE` keywords that follow CREATE.
        // We stay strict: the two keywords must be the immediate next
        // two non-trivial tokens after CREATE. Otherwise we skip the
        // fix (still report) to avoid mangling unexpected syntax.
        const orIdx = found.createIdx + 1;
        const replaceIdx = found.createIdx + 2;
        const orTok = tokens[orIdx];
        const replaceTok = tokens[replaceIdx];
        // `OR` is a Keyword, but `REPLACE` is emitted as an Identifier
        // by the upstream parser — match value, not just type.
        const canFix =
          orTok != null &&
          orTok.value.toUpperCase() === "OR" &&
          replaceTok != null &&
          replaceTok.value.toUpperCase() === "REPLACE";
        // Advance cursor past `OR REPLACE` so a later CREATE in the
        // same file isn't tripped up by these tokens.
        if (canFix) cursor = replaceTok!.range[1];
        context.report({
          loc: create.loc,
          messageId: "unexpectedOrReplace",
          data: { kind },
          fix: canFix
            ? (fixer) =>
                fixer.removeRange([create.range[1], replaceTok!.range[1]])
            : null,
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
