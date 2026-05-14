import type { Rule } from "eslint";

interface FkInfo {
  // The leading column of the FK key. Index lookups for FK enforcement
  // can only use an index if its first column matches.
  leadingCol: string;
  // Node to report against. Inline FK on a column is the Constraint
  // attached to the ColumnDef; table-level FK is the AlterTableCmd
  // (or the table-level Constraint inside CreateStmt.tableElts).
  reportNode: object;
}

interface TableInfo {
  fks: FkInfo[];
  indexedLeadingCols: Set<string>;
}

const getNameFromString = (n: unknown): string | undefined => {
  if (!n || typeof n !== "object") return undefined;
  const sval = (n as { sval?: unknown }).sval;
  return typeof sval === "string" ? sval : undefined;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require an index on every foreign-key column; without it a `DELETE` or `UPDATE` on the referenced table sequentially scans the referencing table to enforce the constraint",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      missingIndex:
        "Foreign-key column `{{col}}` has no covering index in this file. Without one, a DELETE / UPDATE of the parent row sequentially scans this table to enforce the FK.",
    },
  },
  create(context) {
    const tables = new Map<string, TableInfo>();
    const get = (name: string): TableInfo => {
      let info = tables.get(name);
      if (!info) {
        info = { fks: [], indexedLeadingCols: new Set() };
        tables.set(name, info);
      }
      return info;
    };

    return {
      CreateStmt(node: { relation?: unknown; tableElts?: unknown[] }) {
        const relname = (node.relation as { relname?: unknown } | undefined)
          ?.relname;
        if (typeof relname !== "string") return;
        const info = get(relname);
        for (const elt of node.tableElts ?? []) {
          if (!elt || typeof elt !== "object") continue;
          const e = elt as {
            type?: unknown;
            colname?: unknown;
            constraints?: unknown[];
            contype?: unknown;
            fk_attrs?: unknown[];
            keys?: unknown[];
          };
          if (e.type === "ColumnDef" && typeof e.colname === "string") {
            const colname = e.colname;
            for (const c of e.constraints ?? []) {
              if (!c || typeof c !== "object") continue;
              const con = c as { contype?: unknown };
              if (
                con.contype === "CONSTR_PRIMARY" ||
                con.contype === "CONSTR_UNIQUE"
              ) {
                info.indexedLeadingCols.add(colname);
              }
              if (con.contype === "CONSTR_FOREIGN") {
                info.fks.push({ leadingCol: colname, reportNode: c });
              }
            }
          } else if (e.type === "Constraint") {
            // Table-level constraint.
            if (e.contype === "CONSTR_FOREIGN") {
              const first = (e.fk_attrs ?? [])[0];
              const leadingCol = getNameFromString(first);
              if (leadingCol) {
                info.fks.push({ leadingCol, reportNode: elt });
              }
            } else if (
              e.contype === "CONSTR_PRIMARY" ||
              e.contype === "CONSTR_UNIQUE"
            ) {
              const first = (e.keys ?? [])[0];
              const leadingCol = getNameFromString(first);
              if (leadingCol) info.indexedLeadingCols.add(leadingCol);
            }
          }
        }
      },
      IndexStmt(node: { relation?: unknown; indexParams?: unknown[] }) {
        const relname = (node.relation as { relname?: unknown } | undefined)
          ?.relname;
        if (typeof relname !== "string") return;
        const first = (node.indexParams ?? [])[0];
        const colname = (first as { name?: unknown } | undefined)?.name;
        if (typeof colname === "string") {
          get(relname).indexedLeadingCols.add(colname);
        }
      },
      AlterTableStmt(node: { relation?: unknown; cmds?: unknown[] }) {
        const relname = (node.relation as { relname?: unknown } | undefined)
          ?.relname;
        if (typeof relname !== "string") return;
        const info = get(relname);
        for (const cmd of node.cmds ?? []) {
          if (!cmd || typeof cmd !== "object") continue;
          const c = cmd as { subtype?: unknown; def?: unknown };
          if (c.subtype !== "AT_AddConstraint") continue;
          const def = c.def as
            | { contype?: unknown; fk_attrs?: unknown[]; keys?: unknown[] }
            | undefined;
          if (!def) continue;
          if (def.contype === "CONSTR_FOREIGN") {
            const leadingCol = getNameFromString((def.fk_attrs ?? [])[0]);
            if (leadingCol) info.fks.push({ leadingCol, reportNode: cmd });
          } else if (
            def.contype === "CONSTR_PRIMARY" ||
            def.contype === "CONSTR_UNIQUE"
          ) {
            const leadingCol = getNameFromString((def.keys ?? [])[0]);
            if (leadingCol) info.indexedLeadingCols.add(leadingCol);
          }
        }
      },
      "Program:exit"() {
        for (const info of tables.values()) {
          for (const fk of info.fks) {
            if (info.indexedLeadingCols.has(fk.leadingCol)) continue;
            context.report({
              node: fk.reportNode as unknown as Rule.Node,
              messageId: "missingIndex",
              data: { col: fk.leadingCol },
            });
          }
        }
      },
    };
  },
};

export default rule;
