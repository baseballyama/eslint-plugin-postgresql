import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require LIMIT clause in SELECT statements",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      missingLimit:
        "SELECT statement should include a LIMIT clause to prevent excessive data retrieval",
    },
  },
  create(context) {
    return {
      SelectStmt(node: Ast.SelectStmt) {
        // libpg-query rewrites `INSERT INTO t VALUES (...)` as an
        // InsertStmt whose `selectStmt` is a SelectStmt with a non-
        // empty `valuesLists` and no `targetList` — i.e. a synthetic
        // "SELECT of literal rows", not a user-written SELECT. LIMIT
        // is meaningless there, so skip (#159).
        const valuesLists = (node as { valuesLists?: unknown }).valuesLists;
        if (Array.isArray(valuesLists) && valuesLists.length > 0) return;

        // A plain SELECT with no FROM clause returns exactly one row —
        // `SELECT pg_advisory_xact_lock($1)`, `SELECT set_config(...)`,
        // `SELECT 1`. There is nothing to limit, and LIMIT would only add
        // noise. Set operations (`op` other than `SETOP_NONE`) also carry no
        // `fromClause` of their own but do have arms that can return many
        // rows, so they stay in scope.
        const fromClause = node.fromClause;
        const hasFrom = Array.isArray(fromClause) && fromClause.length > 0;
        if (node.op === "SETOP_NONE" && !hasFrom) return;

        // A SELECT has a LIMIT if `limitCount` is set and `limitOption`
        // isn't the parser's default sentinel.
        const hasLimit =
          node.limitCount != null &&
          node.limitOption !== "LIMIT_OPTION_DEFAULT";
        if (!hasLimit) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "missingLimit",
          });
        }
      },
    };
  },
};

export default rule;
