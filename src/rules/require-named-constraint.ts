import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isConstraint } from "../utils/ast.js";

const NAMED_CONSTRAINT_TYPES = new Set<string>([
  "CONSTR_CHECK",
  "CONSTR_UNIQUE",
  "CONSTR_FOREIGN",
  "CONSTR_EXCLUSION",
]);

const isUnnamedNamedKind = (c: Ast.Constraint): boolean => {
  const contype = c.contype;
  if (typeof contype !== "string") return false;
  if (!NAMED_CONSTRAINT_TYPES.has(contype)) return false;
  const named = (c as Ast.Constraint & { conname?: unknown }).conname;
  return typeof named !== "string" || named.length === 0;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require an explicit name on table-level CHECK, UNIQUE, FOREIGN KEY, and EXCLUSION constraints",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      requireNamedConstraint:
        "Table-level CHECK / UNIQUE / FOREIGN KEY / EXCLUSION constraints should be named with `CONSTRAINT <name>`. Auto-generated names are unpredictable across environments and make later `DROP CONSTRAINT` / `ALTER CONSTRAINT` migrations brittle.",
    },
  },
  create(context) {
    return {
      // Table-level constraint inside `CREATE TABLE (..., CHECK (...))`.
      CreateStmt(node: Ast.CreateStmt) {
        const elts = node.tableElts;
        if (!Array.isArray(elts)) return;
        for (const elt of elts) {
          if (!isConstraint(elt)) continue;
          if (!isUnnamedNamedKind(elt)) continue;
          context.report({
            node: elt as unknown as Rule.Node,
            messageId: "requireNamedConstraint",
          });
        }
      },
      // `ALTER TABLE ... ADD CONSTRAINT? ... ` — also catches the bare `ADD CHECK`
      // / `ADD UNIQUE` / `ADD FOREIGN KEY` forms that omit the constraint name.
      AlterTableCmd(node: Ast.AlterTableCmd) {
        if (node.subtype !== "AT_AddConstraint") return;
        const def = node.def;
        if (!isConstraint(def)) return;
        if (!isUnnamedNamedKind(def)) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "requireNamedConstraint",
        });
      },
    };
  },
};

export default rule;
