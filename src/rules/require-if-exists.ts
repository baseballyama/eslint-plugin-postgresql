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
    // No autofix on purpose. Adding `IF EXISTS` to a `DROP` is a
    // runtime-semantics change: without it, dropping a missing object
    // raises an error; with it, the same statement silently no-ops.
    // The author is the one who decides which behavior is correct for
    // a given migration (idempotent re-run vs. a guard that fails fast
    // on schema drift), so the linter only reports — it does not edit.
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

      // Constrain the token search to the visited node's own range so
      // we only report on the `DROP` keyword that opens this statement.
      // (Earlier `--fix` builds of this rule scanned the whole file and
      // mis-attributed reports to `ALTER TABLE ... DROP CONSTRAINT` /
      // `DROP COLUMN`. We keep the bounded scan here for accurate
      // report locations, even though we no longer autofix.)
      // postgresql-eslint-parser >= 0.5.3 anchors top-level statement
      // ranges via `stmt_location` / `stmt_len`, so `node.range` is
      // reliable.
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
