import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const CTE_TYPE = "CommonTableExpr";
const SUBLINK_TYPE = "SubLink";
const MODIFYING_STMT_TYPES = new Set(["UpdateStmt", "DeleteStmt"]);

/**
 * `BaseNode.parent` is declared upstream as `SQLStatementNode | Program`,
 * but the ESLint traversal assigns whatever node actually encloses the
 * child (`SubLink`, `CommonTableExpr`, ...). Read the chain structurally.
 */
type Ancestor = { type: string; parent?: unknown };

const asAncestor = (value: unknown): Ancestor | undefined =>
  typeof value === "object" && value !== null ? (value as Ancestor) : undefined;

/**
 * `true` when the enclosing statement may run this sub-SELECT once per
 * candidate row. The walk stops at the first ancestor that settles the
 * question:
 *
 * - `CommonTableExpr` — the sub-SELECT is a CTE body, and PostgreSQL
 *   guarantees single-evaluation semantics there. This is the fix, so
 *   never report it.
 * - `UpdateStmt` / `DeleteStmt` — the sub-SELECT belongs to a
 *   data-modifying statement. Dangerous only when reached through a
 *   `SubLink`, i.e. an expression sub-SELECT such as `IN (...)`,
 *   `EXISTS (...)` or `= (...)`. A sub-SELECT in `FROM` / `USING` is
 *   planned as its own scan node and is not covered here.
 */
const isReevaluatedPerRow = (node: Ast.SelectStmt): boolean => {
  let crossedSubLink = false;
  let current = asAncestor((node as { parent?: unknown }).parent);
  while (current) {
    if (current.type === CTE_TYPE) return false;
    if (current.type === SUBLINK_TYPE) crossedSubLink = true;
    else if (MODIFYING_STMT_TYPES.has(current.type)) return crossedSubLink;
    current = asAncestor(current.parent);
  }
  return false;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow an expression sub-`SELECT` that combines a row-locking clause with `LIMIT` / `OFFSET` inside `UPDATE` / `DELETE`, because the sub-`SELECT` is re-evaluated per row and the limit does not bound how many rows the statement modifies",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      lockingSubqueryWithLimit:
        "This sub-`SELECT` combines a row-locking clause (`FOR UPDATE` / `FOR NO KEY UPDATE` / `FOR SHARE` / `FOR KEY SHARE`) with `LIMIT` / `OFFSET`, and PostgreSQL may re-run it for every candidate row of the enclosing `UPDATE` / `DELETE`. Each re-run silently skips the rows this statement already modified, so the window slides and the limit stops bounding the number of modified rows. Move the sub-`SELECT` into a `WITH` clause, which PostgreSQL evaluates exactly once.",
    },
  },
  create(context) {
    return {
      SelectStmt(node: Ast.SelectStmt) {
        if (!node.lockingClause?.length) return;
        if (node.limitCount == null && node.limitOffset == null) return;
        if (!isReevaluatedPerRow(node)) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "lockingSubqueryWithLimit",
        });
      },
    };
  },
};

export default rule;
