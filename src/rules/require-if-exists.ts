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
    const visit = (node: {
      missing_ok?: unknown;
      range?: readonly [number, number];
    }): void => {
      if (node.missing_ok === true) return;

      // Constrain the token search to the visited node's own range.
      // The previous implementation scanned all file tokens with a
      // module-scoped cursor, which let the visitor land on a `DROP`
      // keyword that belonged to an unrelated `ALTER TABLE ... DROP
      // CONSTRAINT` / `DROP COLUMN` and apply the `IF EXISTS` fix
      // there. Worse, ESLint's `--fix` loop re-parsed the corrupted
      // file and inserted a second `IF EXISTS`, producing
      // `DROP CONSTRAINT IF EXISTS IF EXISTS ...` syntax errors.
      // postgresql-eslint-parser >= 0.5.2 anchors top-level statement
      // ranges via `stmt_location` / `stmt_len`, so `node.range` is
      // now reliable.
      const range = node.range;
      if (!Array.isArray(range) || range[1] - range[0] <= 0) return;
      const [nodeStart, nodeEnd] = range;

      const tokens = (context.sourceCode.ast.tokens ?? []) as Tokenish[];
      let dropIdx = -1;
      for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i]!;
        if (tok.range[0] < nodeStart) continue;
        if (tok.range[0] >= nodeEnd) break;
        if (tok.type === "Keyword" && tok.value.toUpperCase() === "DROP") {
          dropIdx = i;
          break;
        }
      }
      if (dropIdx === -1 || dropIdx + 1 >= tokens.length) return;

      const drop = tokens[dropIdx]!;
      const kind = tokens[dropIdx + 1]!;
      if (kind.range[1] > nodeEnd) return;

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
