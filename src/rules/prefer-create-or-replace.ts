import type { Rule } from "eslint";

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
        "Prefer `CREATE OR REPLACE` for `FUNCTION` / `PROCEDURE` / `VIEW` so re-running a migration on a database that already has the object does not abort",
      category: "Best Practices",
      recommended: false,
    },
    fixable: "code",
    schema: [],
    messages: {
      preferOrReplace:
        "Use `CREATE OR REPLACE {{kind}}` so re-running this migration does not abort with `relation already exists`.",
    },
  },
  create(context) {
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
      if (node.replace === true) return;
      const kind: string =
        kindFromNode === "FUNCTION" && node.is_procedure === true
          ? "PROCEDURE"
          : kindFromNode;
      context.report({
        loc: create.loc,
        messageId: "preferOrReplace",
        data: { kind },
        fix: (fixer) => fixer.insertTextAfterRange(create.range, " OR REPLACE"),
      });
    };
    return {
      CreateFunctionStmt: (n: { replace?: unknown; is_procedure?: unknown }) =>
        visit(n, "FUNCTION"),
      ViewStmt: (n: { replace?: unknown }) => visit(n, "VIEW"),
    };
  },
};

export default rule;
