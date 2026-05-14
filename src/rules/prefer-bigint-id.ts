import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { getTypeName, isColumnDef, isConstraint } from "../utils/ast.js";

const SMALL_INT_TYPES = new Set<string>([
  // pg_catalog-qualified canonical names
  "int2", // SMALLINT
  "int4", // INT / INTEGER
  // The pseudo-types pg uses when SERIAL is rewritten
  "smallserial",
  "serial",
]);

const isPrimaryKey = (col: Ast.ColumnDef): boolean => {
  const constraints = col.constraints;
  if (!Array.isArray(constraints)) return false;
  return constraints.some(
    (c) => isConstraint(c) && c.contype === "CONSTR_PRIMARY",
  );
};

const isTablePrimaryKeyOn = (
  elts: Ast.CreateStmt["tableElts"],
  colname: string,
): boolean => {
  if (!Array.isArray(elts)) return false;
  return elts.some((elt) => {
    if (!isConstraint(elt)) return false;
    if (elt.contype !== "CONSTR_PRIMARY") return false;
    const keys = (elt as Ast.Constraint & { keys?: unknown }).keys;
    if (!Array.isArray(keys)) return false;
    return keys.some(
      (k) =>
        typeof k === "object" &&
        k !== null &&
        (k as { sval?: unknown }).sval === colname,
    );
  });
};

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer `bigint` for primary-key `id` columns; `int` / `smallint` primary keys risk silent overflow on growing tables",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      preferBigintId:
        "Primary-key `id` columns should be `bigint`. `int` overflows at 2.1 billion rows and the migration to widen it later requires a table rewrite under `ACCESS EXCLUSIVE`. Declare the column as `bigint GENERATED ALWAYS AS IDENTITY` from the start.",
    },
  },
  create(context) {
    return {
      CreateStmt(node: Ast.CreateStmt) {
        const elts = node.tableElts;
        if (!Array.isArray(elts)) return;
        for (const elt of elts) {
          if (!isColumnDef(elt)) continue;
          if (elt.colname !== "id") continue;
          const t = getTypeName(elt.typeName);
          if (typeof t !== "string") continue;
          if (!SMALL_INT_TYPES.has(t)) continue;
          if (!isPrimaryKey(elt) && !isTablePrimaryKeyOn(elts, elt.colname))
            continue;
          context.report({
            node: elt as unknown as Rule.Node,
            messageId: "preferBigintId",
          });
        }
      },
    };
  },
};

export default rule;
