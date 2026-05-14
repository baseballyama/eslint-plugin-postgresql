import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isConstraint } from "../utils/ast.js";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `ALTER TABLE ... ADD CONSTRAINT ... CHECK (...)` without `NOT VALID`; the synchronous form holds `ACCESS EXCLUSIVE` on the table for the entire validating scan",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      checkNotValid:
        "Add this CHECK constraint with `NOT VALID` and run `VALIDATE CONSTRAINT` separately, so the validating scan does not block writers under `ACCESS EXCLUSIVE`.",
    },
  },
  create(context) {
    return {
      AlterTableCmd(node: Ast.AlterTableCmd) {
        if (node.subtype !== "AT_AddConstraint") return;
        const def = node.def;
        if (!isConstraint(def)) return;
        if ((def as { contype?: string }).contype !== "CONSTR_CHECK") return;
        if ((def as { skip_validation?: boolean }).skip_validation === true) {
          return;
        }
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "checkNotValid",
        });
      },
    };
  },
};

export default rule;
