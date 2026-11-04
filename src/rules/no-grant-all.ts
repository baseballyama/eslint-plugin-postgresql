import type { Ast } from "postgresql-eslint-parser";
import type { RuleModule } from "../utils/rule.js";

const rule: RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `GRANT ALL` / `GRANT ALL PRIVILEGES`; enumerate the privileges actually needed so the grant is auditable and a future PG release adding a new privilege does not silently extend it",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noGrantAll:
        "`GRANT ALL` (or `GRANT ALL PRIVILEGES`) is opaque — list the privileges you actually need (e.g. `SELECT, INSERT, UPDATE`) so the grant is auditable and adding a new PostgreSQL privilege in a future release does not silently extend it.",
    },
  },
  create(context) {
    return {
      GrantStmt(node: Ast.GrantStmt) {
        // `GrantStmt` covers both GRANT and REVOKE; we only care about
        // GRANT (REVOKE ALL is fine — taking everything back is the
        // safe direction).
        if (node.is_grant !== true) return;
        // libpg-query represents `GRANT ALL` (or `GRANT ALL
        // PRIVILEGES`) as `privileges: undefined / null`. A specific
        // list of privileges populates the array.
        if (
          Array.isArray(node["privileges"]) &&
          node["privileges"].length > 0
        ) {
          return;
        }
        context.report({
          node,
          messageId: "noGrantAll",
        });
      },
    };
  },
};

export default rule;
