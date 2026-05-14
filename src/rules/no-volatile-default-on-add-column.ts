import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isConstraint } from "../utils/ast.js";

// Known PostgreSQL VOLATILE functions whose value differs row-to-row
// when used as a column DEFAULT. Using one of these on
// `ALTER TABLE ... ADD COLUMN` forces a full table rewrite (PG10+
// short-cut for stable defaults does not apply), holding ACCESS
// EXCLUSIVE on the table for the duration of the rewrite.
//
// `now()` / `current_timestamp` / `current_date` are STABLE within a
// statement and therefore qualify for the stable-default short-cut,
// so they are NOT in this set.
const VOLATILE_DEFAULTS: ReadonlySet<string> = new Set([
  "random",
  "gen_random_uuid",
  "uuid_generate_v1",
  "uuid_generate_v1mc",
  "uuid_generate_v4",
  "clock_timestamp",
  "timeofday",
]);

const isVolatileDefault = (raw_expr: unknown): string | null => {
  if (!raw_expr || typeof raw_expr !== "object") return null;
  const node = raw_expr as { type?: unknown };
  // `gen_random_uuid()::uuid` and similar appear as TypeCast around
  // the actual call; unwrap one level.
  if (node.type === "TypeCast") {
    return isVolatileDefault((raw_expr as { arg?: unknown }).arg);
  }
  if (node.type !== "FuncCall") return null;
  const funcname = (raw_expr as { funcname?: unknown }).funcname;
  if (!Array.isArray(funcname)) return null;
  // The last element of `funcname` is the unqualified function
  // name; earlier elements are schema qualifiers.
  const last = funcname.at(-1) as { sval?: unknown } | undefined;
  const name = last?.sval;
  if (typeof name !== "string") return null;
  return VOLATILE_DEFAULTS.has(name) ? name : null;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `ALTER TABLE ... ADD COLUMN ... DEFAULT <volatile>()`; volatile defaults force a full table rewrite under `ACCESS EXCLUSIVE` because the stable-default short-cut cannot be used",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noVolatileDefault:
        "`{{fn}}()` is VOLATILE — using it as a column DEFAULT on `ADD COLUMN` forces PostgreSQL to rewrite the entire table under `ACCESS EXCLUSIVE`. Add the column without a default, then `UPDATE` rows in batches.",
    },
  },
  create(context) {
    return {
      AlterTableCmd(node: Ast.AlterTableCmd) {
        if (node.subtype !== "AT_AddColumn") return;
        const def = node.def as { constraints?: unknown } | undefined;
        const constraints = Array.isArray(def?.constraints)
          ? def.constraints
          : [];
        for (const c of constraints) {
          if (!isConstraint(c)) continue;
          if ((c as { contype?: string }).contype !== "CONSTR_DEFAULT") {
            continue;
          }
          const fn = isVolatileDefault((c as { raw_expr?: unknown }).raw_expr);
          if (!fn) continue;
          context.report({
            node: c as unknown as Rule.Node,
            messageId: "noVolatileDefault",
            data: { fn },
          });
        }
      },
    };
  },
};

export default rule;
