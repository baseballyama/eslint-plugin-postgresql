import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isConstraint } from "../utils/ast.js";

type Style = "always" | "never";

const DEFAULT_STYLE: Style = "always";

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
        "Enforce a consistent stance on `NOT VALID` for `ALTER TABLE ... ADD FOREIGN KEY` (either always require it, or always forbid it)",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [
      {
        type: "object",
        properties: {
          style: { enum: ["always", "never"] },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferFkNotValid:
        "Adding a foreign key without `NOT VALID` validates every existing row under an `ACCESS EXCLUSIVE` lock that blocks writers. Use `ADD CONSTRAINT ... FOREIGN KEY (...) REFERENCES ... NOT VALID`, then `ALTER TABLE ... VALIDATE CONSTRAINT` in a separate migration (`VALIDATE` only takes a `SHARE UPDATE EXCLUSIVE` lock).",
      unexpectedFkNotValid:
        "Avoid `NOT VALID` on foreign keys. The constraint is added in a non-validated state and won't reject existing violations until you remember to run `VALIDATE CONSTRAINT`; some projects prefer to fail loudly at constraint-add time instead.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { style?: Style };
    const style: Style = option.style ?? DEFAULT_STYLE;
    return {
      AlterTableCmd(node: Ast.AlterTableCmd) {
        if (node.subtype !== "AT_AddConstraint") return;
        const def = node.def;
        if (!isFkConstraint(def)) return;
        const skips = skipsValidation(def);
        if (style === "always" && !skips) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "preferFkNotValid",
          });
          return;
        }
        if (style === "never" && skips) {
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "unexpectedFkNotValid",
          });
        }
      },
    };
  },
};

export default rule;
