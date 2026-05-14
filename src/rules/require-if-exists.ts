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
        "Require `IF EXISTS` on every `DROP` statement so re-running a migration on a database that already lost the object does not error",
      category: "Best Practices",
      recommended: false,
    },
    fixable: "code",
    schema: [],
    messages: {
      missingIfExists:
        "Add `IF EXISTS` to this `DROP` so re-running the migration on a database that already lost the object does not abort.",
    },
  },
  create(context) {
    // The parser sometimes emits `[0, 0]` for the first top-level
    // statement's `range`, which makes node.range-based DROP token
    // lookup unreliable. Track a per-file cursor that advances past
    // the most recently consumed `DROP`, so DropStmt / DropdbStmt
    // visits in body order each find the next un-consumed one.
    let cursor = 0;
    const findNextDrop = (
      tokens: readonly Tokenish[],
    ): { dropIdx: number; kindIdx: number } | null => {
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i]!.range[0] < cursor) continue;
        if (
          tokens[i]!.type === "Keyword" &&
          tokens[i]!.value.toUpperCase() === "DROP" &&
          i + 1 < tokens.length
        ) {
          return { dropIdx: i, kindIdx: i + 1 };
        }
      }
      return null;
    };

    const visit = (node: { missing_ok?: unknown }): void => {
      const tokens = (context.sourceCode.ast.tokens ?? []) as Tokenish[];
      const found = findNextDrop(tokens);
      if (!found) return;
      const { dropIdx, kindIdx } = found;
      const drop = tokens[dropIdx]!;
      const kind = tokens[kindIdx]!;
      // Advance past this DROP so the next visitor invocation skips
      // over it. Done before the missing_ok check so a compliant
      // DROP also moves the cursor forward.
      cursor = kind.range[1];
      if (node.missing_ok === true) return;
      context.report({
        loc: { start: drop.loc.start, end: kind.loc.end },
        messageId: "missingIfExists",
        fix: (fixer) => fixer.insertTextAfterRange(kind.range, " IF EXISTS"),
      });
    };
    return {
      DropStmt: visit,
      DropdbStmt: visit,
      DropRoleStmt: visit,
      DropSubscriptionStmt: visit,
    };
  },
};

export default rule;
