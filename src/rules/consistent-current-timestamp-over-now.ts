import type { RuleModule } from "../utils/rule.js";

type Style = "always" | "never";

const DEFAULT_STYLE: Style = "always";

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
    return {
      Program() {
        const tokens = context.sourceCode.ast.tokens ?? [];
        for (let i = 0; i < tokens.length; i++) {
          const tok = tokens[i]!;
          // `now()` — three-token sequence Identifier "(" ")".
          if (
            style === "always" &&
            tok.type === "Identifier" &&
            tok.value.toLowerCase() === "now" &&
            i + 2 < tokens.length
          ) {
            const open = tokens[i + 1]!;
            const close = tokens[i + 2]!;
            if (open.value === "(" && close.value === ")") {
              context.report({
                loc: { start: tok.loc.start, end: close.loc.end },
                messageId: "preferCurrentTimestamp",
                fix: (fixer) =>
                  fixer.replaceTextRange(
                    [tok.range[0], close.range[1]],
                    "CURRENT_TIMESTAMP",
                  ),
              });
            }
            continue;
          }
          // `CURRENT_TIMESTAMP` / `LOCALTIMESTAMP` / `LOCALTIME` — bareword
          // keyword tokens.
          if (tok.type !== "Keyword") continue;
          const upper = tok.value.toUpperCase();
          // `now()` takes no precision, so `CURRENT_TIMESTAMP(3)` is the only
          // spelling of a rounded `timestamptz`.
          const timestamptz =
            style === "never" && tokens[i + 1]?.value !== "("
              ? "now()"
              : "CURRENT_TIMESTAMP";
          if (upper === "CURRENT_TIMESTAMP" && timestamptz === "now()") {
            context.report({
              loc: tok.loc,
              messageId: "preferNow",
              fix: (fixer) => fixer.replaceTextRange(tok.range, "now()"),
            });
          } else if (upper === "LOCALTIMESTAMP") {
            context.report({
              loc: tok.loc,
              messageId: "preferCurrentTimestampOverLocal",
              data: { replacement: timestamptz },
              fix: (fixer) => fixer.replaceTextRange(tok.range, timestamptz),
            });
          } else if (upper === "LOCALTIME") {
            context.report({
              loc: tok.loc,
              messageId: "preferCurrentTimeOverLocal",
              fix: (fixer) => fixer.replaceTextRange(tok.range, "CURRENT_TIME"),
            });
          }
        }
      },
    };
  },
};

export default rule;
