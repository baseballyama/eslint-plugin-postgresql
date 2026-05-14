import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `SELECT ... INTO target FROM ...` (creates a new table); use `CREATE TABLE AS SELECT ...` instead",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noSelectInto:
        "`SELECT ... INTO target FROM ...` creates a new table whose semantics differ from a regular `SELECT` and conflict with PL/pgSQL's `SELECT INTO variable`. Use `CREATE TABLE target AS SELECT ...` so the intent is explicit.",
    },
  },
  create(context) {
    return {
      SelectStmt(node: Ast.SelectStmt) {
        if (!node.intoClause) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noSelectInto",
        });
      },
    };
  },
};

export default rule;
