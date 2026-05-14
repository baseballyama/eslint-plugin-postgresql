import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isConstraint } from "../utils/ast.js";

const isFkConstraint = (def: unknown): def is Ast.Constraint => {
  if (!isConstraint(def)) return false;
  return def.contype === "CONSTR_FOREIGN";
};

// `NOT VALID` causes the parser to set `skip_validation: true`; without
// `NOT VALID`, the parser sets `initially_valid: true`.
const skipsValidation = (constraint: Ast.Constraint): boolean => {
  const c = constraint as Ast.Constraint & { skip_validation?: boolean };
  return c.skip_validation === true;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require `ALTER TABLE ... ADD FOREIGN KEY ...` to use `NOT VALID` so validation does not take an ACCESS EXCLUSIVE lock for the full scan",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      preferFkNotValid:
        "Adding a foreign key without `NOT VALID` validates every existing row under an `ACCESS EXCLUSIVE` lock that blocks writers. Use `ADD CONSTRAINT ... FOREIGN KEY (...) REFERENCES ... NOT VALID`, then `ALTER TABLE ... VALIDATE CONSTRAINT` in a separate migration (`VALIDATE` only takes a `SHARE UPDATE EXCLUSIVE` lock).",
    },
  },
  create(context) {
    return {
      AlterTableCmd(node: Ast.AlterTableCmd) {
        if (node.subtype !== "AT_AddConstraint") return;
        const def = node.def;
        if (!isFkConstraint(def)) return;
        if (skipsValidation(def)) return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "preferFkNotValid",
        });
      },
    };
  },
};

export default rule;
