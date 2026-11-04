import type { Ast } from "postgresql-eslint-parser";
import type { RuleModule } from "../utils/rule.js";

type Style = "always" | "never";

const DEFAULT_STYLE: Style = "always";

const NOW = "now()";
const CURRENT_TIMESTAMP = "CURRENT_TIMESTAMP";
const CURRENT_TIME = "CURRENT_TIME";

const rule: RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Enforce a consistent stance on SQL-standard `CURRENT_TIMESTAMP` vs PostgreSQL's `now()`, and flag the timezone-naive `LOCALTIMESTAMP` / `LOCALTIME`",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
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
      preferCurrentTimestamp:
        "Use the SQL-standard `CURRENT_TIMESTAMP` instead of `now()`.",
      preferNow: "Use `now()` instead of `CURRENT_TIMESTAMP`.",
      preferCurrentTimestampOverLocal:
        "Use `{{replacement}}` instead of `LOCALTIMESTAMP`. `LOCALTIMESTAMP` returns a timezone-naive `timestamp`; `{{replacement}}` returns `timestamptz`, which is what most apps actually want.",
      preferCurrentTimeOverLocal:
        "Use `CURRENT_TIME` instead of `LOCALTIME`. `LOCALTIME` returns a timezone-naive `time`; `CURRENT_TIME` returns `timetz`.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { style?: Style };
    const style: Style = option.style ?? DEFAULT_STYLE;
    const sourceCode = context.sourceCode;
    // Visiting `SQLValueFunction` / `FuncCall` rather than scanning tokens
    // leaves names alone: `AS current_timestamp`, `t.localtimestamp` and
    // `pg_catalog.now()` tokenize like the functions but are not these nodes.
    return {
      SQLValueFunction(node: Ast.SQLValueFunctionPG) {
        // A `*_N` op carries a precision (`CURRENT_TIMESTAMP(3)`), which
        // `now()` cannot take. The node's range covers only the keyword, so
        // replacing it keeps the `(p)` that follows.
        const report = (
          messageId: string,
          replacement: string,
          data?: Record<string, string>,
        ) =>
          context.report({
            node,
            messageId,
            ...(data && { data }),
            fix: (fixer) => fixer.replaceTextRange(node.range, replacement),
          });
        switch (node.op) {
          case "SVFOP_CURRENT_TIMESTAMP":
            if (style === "never") report("preferNow", NOW);
            return;
          case "SVFOP_LOCALTIMESTAMP":
          case "SVFOP_LOCALTIMESTAMP_N": {
            const replacement =
              style === "never" && node.op === "SVFOP_LOCALTIMESTAMP"
                ? NOW
                : CURRENT_TIMESTAMP;
            report("preferCurrentTimestampOverLocal", replacement, {
              replacement,
            });
            return;
          }
          case "SVFOP_LOCALTIME":
          case "SVFOP_LOCALTIME_N":
            report("preferCurrentTimeOverLocal", CURRENT_TIME);
        }
      },
      FuncCall(node: Ast.FuncCall) {
        if (style !== "always") return;
        // Only a bare, unqualified `now()`.
        if (
          node.funcname?.length !== 1 ||
          node.funcname[0]!.sval !== "now" ||
          node.args !== undefined
        )
          return;
        const name = sourceCode.getTokenByRangeStart(node.range[0])!;
        const open = sourceCode.getTokenAfter(name);
        const close = open && sourceCode.getTokenAfter(open);
        if (open?.value !== "(" || close?.value !== ")") return;
        context.report({
          loc: { start: name.loc.start, end: close.loc.end },
          messageId: "preferCurrentTimestamp",
          fix: (fixer) =>
            fixer.replaceTextRange(
              [name.range[0], close.range[1]],
              CURRENT_TIMESTAMP,
            ),
        });
      },
    };
  },
};

export default rule;
