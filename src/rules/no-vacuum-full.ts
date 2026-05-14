import type { Rule } from "eslint";

interface DefElem {
  type: "DefElem";
  defname?: string;
}

interface VacuumStmt {
  type: "VacuumStmt";
  options?: DefElem[];
}

const hasFullOption = (options: VacuumStmt["options"]): boolean => {
  if (!Array.isArray(options)) return false;
  return options.some((o) => o && o.type === "DefElem" && o.defname === "full");
};

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `VACUUM FULL` because it takes ACCESS EXCLUSIVE and rewrites the entire table",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noVacuumFull:
        "`VACUUM FULL` takes `ACCESS EXCLUSIVE` and rewrites the whole table; the table is unavailable for the duration. For shrinking a bloated table on a live database, use `pg_repack` or `pg_squeeze`. A plain `VACUUM` (no `FULL`) is fine.",
    },
  },
  create(context) {
    return {
      VacuumStmt(node: VacuumStmt) {
        if (!hasFullOption(node.options)) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "noVacuumFull",
        });
      },
    };
  },
};

export default rule;
