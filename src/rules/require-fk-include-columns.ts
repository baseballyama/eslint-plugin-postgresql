import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isConstraint } from "../utils/ast.js";

interface Options {
  columns: string[];
  excludeTablePattern?: string;
  excludeReferencedTablePattern?: string;
}

const getStringName = (n: unknown): string | undefined => {
  if (typeof n === "string") return n;
  if (!n || typeof n !== "object") return undefined;
  const sval = (n as { sval?: unknown }).sval;
  if (typeof sval === "string") return sval;
  // Some parser shapes wrap the value as `{ type: "String", sval: { sval } }`.
  const inner = (n as { sval?: { sval?: unknown } }).sval;
  if (inner && typeof inner === "object") {
    const innerSval = (inner as { sval?: unknown }).sval;
    if (typeof innerSval === "string") return innerSval;
  }
  return undefined;
};

const getReferencedTableName = (pktable: unknown): string | undefined => {
  if (!pktable || typeof pktable !== "object") return undefined;
  const relname = (pktable as { relname?: unknown }).relname;
  return typeof relname === "string" ? relname : undefined;
};

const collectFkAttrs = (fkAttrs: unknown): string[] => {
  if (!Array.isArray(fkAttrs)) return [];
  const out: string[] = [];
  for (const a of fkAttrs) {
    const name = getStringName(a);
    if (name) out.push(name);
  }
  return out;
};

const findMissingColumns = (
  fkColumns: readonly string[],
  required: readonly string[],
): string[] => {
  const present = new Set(fkColumns);
  return required.filter((c) => !present.has(c));
};

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require every foreign-key constraint to include a configured set of columns (e.g. `tenant_id` in a multi-tenant database)",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [
      {
        type: "object",
        properties: {
          columns: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
            minItems: 1,
          },
          excludeTablePattern: { type: "string" },
          excludeReferencedTablePattern: { type: "string" },
        },
        required: ["columns"],
        additionalProperties: false,
      },
    ],
    messages: {
      missingFkColumn:
        "Foreign-key constraint on `{{table}}` references `{{refTable}}` but does not include `{{missing}}`. In a multi-tenant database every FK should carry the tenant key so a child row cannot point at a parent in a different tenant.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as Partial<Options>;
    const required = option.columns ?? [];
    if (required.length === 0) return {};
    // Schema validation guarantees these are well-formed strings; we accept
    // the cost of a RegExp construction once per file rather than per FK.
    const tableExclude = option.excludeTablePattern
      ? new RegExp(option.excludeTablePattern)
      : undefined;
    const refExclude = option.excludeReferencedTablePattern
      ? new RegExp(option.excludeReferencedTablePattern)
      : undefined;

    const check = (params: {
      reportNode: object;
      tableName: string | undefined;
      constraint: Ast.Constraint;
      fkColumns: readonly string[];
    }): void => {
      const { reportNode, tableName, constraint, fkColumns } = params;
      if (tableName && tableExclude?.test(tableName)) return;
      const refTable = getReferencedTableName(constraint.pktable);
      if (refTable && refExclude?.test(refTable)) return;
      const missing = findMissingColumns(fkColumns, required);
      if (missing.length === 0) return;
      for (const col of missing) {
        context.report({
          node: reportNode as Rule.Node,
          messageId: "missingFkColumn",
          data: {
            table: tableName ?? "(unknown)",
            refTable: refTable ?? "(unknown)",
            missing: col,
          },
        });
      }
    };

    return {
      CreateStmt(node: Ast.CreateStmt) {
        const relation = node.relation as { relname?: unknown } | undefined;
        const tableName =
          typeof relation?.relname === "string" ? relation.relname : undefined;
        for (const elt of node.tableElts ?? []) {
          if (!elt || typeof elt !== "object") continue;
          const e = elt as {
            type?: unknown;
            colname?: unknown;
            constraints?: unknown[];
          };
          if (e.type === "ColumnDef" && typeof e.colname === "string") {
            for (const c of e.constraints ?? []) {
              if (!isConstraint(c)) continue;
              if (c.contype !== "CONSTR_FOREIGN") continue;
              check({
                reportNode: c,
                tableName,
                constraint: c,
                // Column-level FK has no `fk_attrs`; the FK column is the
                // column it's attached to.
                fkColumns: [e.colname],
              });
            }
          } else if (isConstraint(elt) && elt.contype === "CONSTR_FOREIGN") {
            check({
              reportNode: elt,
              tableName,
              constraint: elt,
              fkColumns: collectFkAttrs(elt.fk_attrs),
            });
          }
        }
      },
      AlterTableStmt(node: Ast.AlterTableStmt) {
        const relation = node.relation as { relname?: unknown } | undefined;
        const tableName =
          typeof relation?.relname === "string" ? relation.relname : undefined;
        for (const cmd of node.cmds ?? []) {
          if (!cmd || typeof cmd !== "object") continue;
          const c = cmd as Ast.AlterTableCmd;
          if (c.subtype !== "AT_AddConstraint") continue;
          const def = c.def;
          if (!isConstraint(def)) continue;
          if (def.contype !== "CONSTR_FOREIGN") continue;
          check({
            reportNode: c,
            tableName,
            constraint: def,
            fkColumns: collectFkAttrs(def.fk_attrs),
          });
        }
      },
    };
  },
};

export default rule;
