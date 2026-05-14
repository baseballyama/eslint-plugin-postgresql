import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isColumnDef, isConstraint } from "../utils/ast.js";

const hasPrimaryKey = (
  tableElts: ReadonlyArray<Ast.TableElement | unknown>,
): boolean => {
  for (const elt of tableElts) {
    if (
      isConstraint(elt) &&
      (elt as Ast.Constraint).contype === "CONSTR_PRIMARY"
    ) {
      return true;
    }
    if (isColumnDef(elt)) {
      const constraints = (elt as Ast.ColumnDef).constraints;
      if (
        Array.isArray(constraints) &&
        constraints.some(
          (c) =>
            isConstraint(c) &&
            (c as Ast.Constraint).contype === "CONSTR_PRIMARY",
        )
      ) {
        return true;
      }
    }
  }
  return false;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require every `CREATE TABLE` to declare a primary key",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      missingPrimaryKey:
        "Table `{{table}}` has no PRIMARY KEY. Tables without one cannot be replicated cleanly, cannot be sharded predictably, and break almost every ORM. Add one as either a column constraint or a table-level constraint.",
    },
  },
  create(context) {
    return {
      CreateStmt(node: Ast.CreateStmt) {
        const elts = node.tableElts;
        // No tableElts means CREATE TABLE ... PARTITION OF or similar; skip.
        if (!Array.isArray(elts) || elts.length === 0) return;
        if (!hasPrimaryKey(elts)) {
          const relation = node.relation as { relname?: unknown } | undefined;
          const relname =
            typeof relation?.relname === "string"
              ? relation.relname
              : "<unknown>";
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "missingPrimaryKey",
            data: { table: relname },
          });
        }
      },
    };
  },
};

export default rule;
