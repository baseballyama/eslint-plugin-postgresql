import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const hasDistinctOn = (
  distinctClause: Ast.SelectStmt["distinctClause"],
): boolean => {
  if (!Array.isArray(distinctClause)) return false;
  // Plain `DISTINCT` parses as a single element with no `type` field; only
  // `DISTINCT ON (...)` populates the elements with real expressions.
  return distinctClause.some(
    (e) => typeof e === "object" && e !== null && "type" in e,
  );
};

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `SELECT DISTINCT ON (...)` without an `ORDER BY`; the surviving row in each group is otherwise non-deterministic",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noDistinctOnWithoutOrderBy:
        "`DISTINCT ON (...)` keeps an arbitrary row from each group unless `ORDER BY` is specified. Add an `ORDER BY` whose leading columns match the `DISTINCT ON` expressions.",
    },
  },
  create(context) {
    return {
      SelectStmt(node: Ast.SelectStmt) {
        if (!hasDistinctOn(node.distinctClause)) return;
        if (Array.isArray(node.sortClause) && node.sortClause.length > 0)
          return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noDistinctOnWithoutOrderBy",
        });
      },
    };
  },
};

export default rule;
