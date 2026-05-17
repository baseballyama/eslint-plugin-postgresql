import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isConstraint } from "../utils/ast.js";

const isCompositePrimaryKey = (def: unknown): boolean => {
  if (!isConstraint(def)) return false;
  const c = def as Ast.Constraint & { keys?: unknown };
  if (c.contype !== "CONSTR_PRIMARY") return false;
  return Array.isArray(c.keys) && c.keys.length > 1;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow composite (multi-column) PRIMARY KEY constraints; use a single surrogate key and a UNIQUE constraint on the natural columns instead",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noCompositePk:
        "Composite PRIMARY KEY is not allowed. Use a single-column surrogate key (e.g. `id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`) and enforce the natural key with a `UNIQUE` constraint. Composite primary keys complicate joins, ORM mapping, and foreign-key references.",
    },
  },
  create(context) {
    return {
      CreateStmt(node: Ast.CreateStmt) {
        const elts = node.tableElts;
        if (!Array.isArray(elts)) return;
        for (const elt of elts) {
          if (isCompositePrimaryKey(elt)) {
            context.report({
              node: elt as unknown as Rule.Node,
              messageId: "noCompositePk",
            });
          }
        }
      },
      AlterTableCmd(node: Ast.AlterTableCmd) {
        if (node.subtype !== "AT_AddConstraint") return;
        if (isCompositePrimaryKey(node.def)) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "noCompositePk",
          });
        }
      },
    };
  },
};

export default rule;
