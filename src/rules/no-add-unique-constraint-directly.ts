import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isConstraint } from "../utils/ast.js";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `ALTER TABLE ... ADD CONSTRAINT ... UNIQUE (...)` written inline; build the index with `CREATE UNIQUE INDEX CONCURRENTLY` first, then promote it via `ADD CONSTRAINT ... UNIQUE USING INDEX <name>`",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      useIndexFirst:
        "Build this UNIQUE constraint's index with `CREATE UNIQUE INDEX CONCURRENTLY` first, then promote it via `ALTER TABLE ... ADD CONSTRAINT ... UNIQUE USING INDEX <name>`. The inline form blocks writers under `ACCESS EXCLUSIVE` for the entire index build.",
    },
  },
  create(context) {
    return {
      AlterTableCmd(node: Ast.AlterTableCmd) {
        if (node.subtype !== "AT_AddConstraint") return;
        const def = node.def;
        if (!isConstraint(def)) return;
        if ((def as { contype?: string }).contype !== "CONSTR_UNIQUE") return;
        // `USING INDEX <name>` populates the constraint's `indexname`;
        // its absence means the user wrote the inline form
        // (`UNIQUE (col1, col2)`) that builds the index synchronously.
        if (typeof (def as { indexname?: unknown }).indexname === "string") {
          return;
        }
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "useIndexFirst",
        });
      },
    };
  },
};

export default rule;
