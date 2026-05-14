import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isConstraint } from "../utils/ast.js";

// FOREIGN KEY and CHECK are the constraint types that need to scan the
// existing rows to validate. Adding them with NOT VALID skips that scan
// and lets a follow-up `VALIDATE CONSTRAINT` happen out-of-band, under
// only a `SHARE UPDATE EXCLUSIVE` lock instead of `ACCESS EXCLUSIVE`.
//
// Other constraint kinds (PRIMARY KEY, UNIQUE, NOT NULL) either build
// indexes or have their own concurrent path and don't benefit from
// NOT VALID.
const VALIDATING_CONTYPES: ReadonlySet<string> = new Set([
  "CONSTR_FOREIGN",
  "CONSTR_CHECK",
]);

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer `ADD CONSTRAINT ... NOT VALID` followed by a separate `VALIDATE CONSTRAINT` to avoid an `ACCESS EXCLUSIVE` lock on the full table while it is being scanned",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      notValid:
        "Add this constraint with `NOT VALID` and run `VALIDATE CONSTRAINT` separately, so the validating scan does not hold `ACCESS EXCLUSIVE` on the table.",
    },
  },
  create(context) {
    return {
      AlterTableCmd(node: Ast.AlterTableCmd) {
        if (node.subtype !== "AT_AddConstraint") return;
        const def = node.def;
        if (!isConstraint(def)) return;
        const contype = (def as { contype?: string }).contype;
        if (!contype || !VALIDATING_CONTYPES.has(contype)) return;
        // `skip_validation === true` means the user wrote `NOT VALID`.
        if ((def as { skip_validation?: boolean }).skip_validation === true) {
          return;
        }
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "notValid",
        });
      },
    };
  },
};

export default rule;
