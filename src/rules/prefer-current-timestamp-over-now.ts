import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Prefer SQL-standard `CURRENT_TIMESTAMP` / `CURRENT_TIME` over PostgreSQL's `now()` and the timezone-naive `LOCALTIMESTAMP` / `LOCALTIME`",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [],
    messages: {
      preferCurrentTimestamp:
        "Use the SQL-standard `CURRENT_TIMESTAMP` instead of `now()`.",
      preferCurrentTimestampOverLocal:
        "Use `CURRENT_TIMESTAMP` instead of `LOCALTIMESTAMP`. `LOCALTIMESTAMP` returns a timezone-naive `timestamp`; `CURRENT_TIMESTAMP` returns `timestamptz`, which is what most apps actually want.",
      preferCurrentTimeOverLocal:
        "Use `CURRENT_TIME` instead of `LOCALTIME`. `LOCALTIME` returns a timezone-naive `time`; `CURRENT_TIME` returns `timetz`.",
    },
  },
  create(context) {
    return {
      Program() {
        const tokens = context.sourceCode.ast.tokens ?? [];
        for (let i = 0; i < tokens.length; i++) {
          const tok = tokens[i]!;
          // `now()` — three-token sequence Identifier "(" ")".
          if (
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
          // `LOCALTIMESTAMP` / `LOCALTIME` — bareword keyword tokens.
          if (tok.type !== "Keyword") continue;
          const upper = tok.value.toUpperCase();
          if (upper === "LOCALTIMESTAMP") {
            context.report({
              loc: tok.loc,
              messageId: "preferCurrentTimestampOverLocal",
              fix: (fixer) =>
                fixer.replaceTextRange(tok.range, "CURRENT_TIMESTAMP"),
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
