import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isColumnDef, isConstraint } from "../utils/ast.js";

const hasNotNull = (col: Ast.ColumnDef): boolean => {
  const constraints = col.constraints;
  if (!Array.isArray(constraints)) return false;
  return constraints.some(
    (c) => isConstraint(c) && c.contype === "CONSTR_NOTNULL",
  );
};

const hasDefault = (col: Ast.ColumnDef): boolean => {
  const constraints = col.constraints;
  if (!Array.isArray(constraints)) return false;
  return constraints.some(
    (c) =>
      isConstraint(c) &&
      (c.contype === "CONSTR_DEFAULT" ||
        c.contype === "CONSTR_GENERATED" ||
        c.contype === "CONSTR_IDENTITY"),
  );
};

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `ALTER TABLE ADD COLUMN ... NOT NULL` without a `DEFAULT` because the migration fails outright on any non-empty table",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noAddColumnNotNullWithoutDefault:
        "`ADD COLUMN ... NOT NULL` without a `DEFAULT` aborts the migration on any table that already has rows. Either supply a `DEFAULT`, or add the column nullable first, backfill, and then `ALTER COLUMN ... SET NOT NULL` in a follow-up.",
    },
  },
  create(context) {
    return {
      AlterTableCmd(node: Ast.AlterTableCmd) {
        if (node.subtype !== "AT_AddColumn") return;
        const def = node.def;
        if (!isColumnDef(def)) return;
        if (!hasNotNull(def)) return;
        if (hasDefault(def)) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noAddColumnNotNullWithoutDefault",
        });
      },
    };
  },
};

export default rule;
