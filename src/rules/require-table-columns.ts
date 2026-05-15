import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isColumnDef } from "../utils/ast.js";

interface Override {
  pattern: string;
  columns: string[];
}

interface Options {
  columns: string[];
  overrides?: Override[];
  exclude?: string;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require every `CREATE TABLE` to include a configured set of columns (e.g. multi-tenant / audit columns like `tenant_id`, `created_at`, `updated_by`)",
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
          overrides: {
            type: "array",
            items: {
              type: "object",
              properties: {
                pattern: { type: "string" },
                columns: {
                  type: "array",
                  items: { type: "string" },
                  uniqueItems: true,
                },
              },
              required: ["pattern", "columns"],
              additionalProperties: false,
            },
          },
          exclude: { type: "string" },
        },
        required: ["columns"],
        additionalProperties: false,
      },
    ],
    messages: {
      missingColumn:
        "`CREATE TABLE {{table}}` is missing required column `{{missing}}`. {{rationale}}",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as Partial<Options>;
    const baseColumns = option.columns ?? [];
    if (baseColumns.length === 0) return {};
    const excludeRe = option.exclude ? new RegExp(option.exclude) : undefined;
    // Pre-compile override regexes once per file. The first matching
    // override wins, so order in the option list is significant.
    const overrides = (option.overrides ?? []).map((o) => ({
      regex: new RegExp(o.pattern),
      pattern: o.pattern,
      columns: o.columns,
    }));

    return {
      CreateStmt(node: Ast.CreateStmt) {
        const relation = node.relation as { relname?: unknown } | undefined;
        const tableName =
          typeof relation?.relname === "string" ? relation.relname : undefined;
        if (!tableName) return;
        if (excludeRe?.test(tableName)) return;

        const match = overrides.find((o) => o.regex.test(tableName));
        const required = match?.columns ?? baseColumns;
        if (required.length === 0) return;

        const present = new Set<string>();
        for (const elt of node.tableElts ?? []) {
          if (isColumnDef(elt) && typeof elt.colname === "string") {
            present.add(elt.colname);
          }
        }

        const rationale = match
          ? `Required by the override for pattern \`${match.pattern}\`.`
          : "Required by the default column list.";
        for (const col of required) {
          if (present.has(col)) continue;
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "missingColumn",
            data: { table: tableName, missing: col, rationale },
          });
        }
      },
    };
  },
};

export default rule;
