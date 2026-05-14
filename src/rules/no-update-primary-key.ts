import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isResTarget } from "../utils/ast.js";

// Default heuristic: any column literally named `id`. Most projects
// follow that convention; the option below lets a project add its own
// names without redefining the default.
const DEFAULT_PK_COLUMN_NAMES: readonly string[] = ["id"];

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `UPDATE ... SET <pk> = ...` for columns the rule treats as primary keys",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [
      {
        type: "object",
        properties: {
          pkColumnNames: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noUpdatePk:
        "Avoid `UPDATE` on the primary-key column `{{name}}`. Primary keys are intended to be immutable; FK references and external systems can hold the old value.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as {
      pkColumnNames?: string[];
    };
    const explicit = option.pkColumnNames ?? DEFAULT_PK_COLUMN_NAMES;
    const pkSet = new Set(explicit);

    return {
      UpdateStmt(node: Ast.UpdateStmt) {
        const relation = node.relation as { relname?: unknown } | undefined;
        const relname =
          typeof relation?.relname === "string" ? relation.relname : undefined;
        // The `<table>_id` heuristic is added per-statement so it tracks
        // the actual table being updated, on top of the configured
        // global names.
        const local = new Set(pkSet);
        if (relname) local.add(`${relname}_id`);

        const targetList = node.targetList;
        if (!Array.isArray(targetList)) return;
        for (const target of targetList) {
          if (!isResTarget(target)) continue;
          const name = target.name;
          if (typeof name !== "string") continue;
          if (!local.has(name)) continue;
          context.report({
            node: target as unknown as Rule.Node,
            messageId: "noUpdatePk",
            data: { name },
          });
        }
      },
    };
  },
};

export default rule;
