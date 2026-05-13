import type { Rule } from "eslint";

const hasPrimaryKey = (tableElts: any[]): boolean => {
  for (const elt of tableElts) {
    if (!elt || typeof elt !== "object") continue;
    // Table-level constraint: { type: "Constraint", contype: "CONSTR_PRIMARY" }
    if (elt.type === "Constraint" && elt.contype === "CONSTR_PRIMARY") {
      return true;
    }
    // Column-level: { type: "ColumnDef", constraints: [{ contype: "CONSTR_PRIMARY" }] }
    if (
      elt.type === "ColumnDef" &&
      Array.isArray(elt.constraints) &&
      elt.constraints.some((c: any) => c?.contype === "CONSTR_PRIMARY")
    ) {
      return true;
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
      CreateStmt(node: any) {
        const elts = Array.isArray(node?.tableElts) ? node.tableElts : [];
        if (elts.length === 0) return; // no columns, e.g. CREATE TABLE ... PARTITION OF
        if (!hasPrimaryKey(elts)) {
          context.report({
            node,
            messageId: "missingPrimaryKey",
            data: { table: node?.relation?.relname ?? "<unknown>" },
          });
        }
      },
    };
  },
};

export default rule;
