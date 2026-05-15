import type { AST, Rule } from "eslint";

// PostgreSQL stores identifiers in a fixed-width `name` column whose size is
// `NAMEDATALEN`. With the default `NAMEDATALEN = 64`, an identifier can hold
// up to 63 bytes plus a NUL terminator. Anything longer is **silently
// truncated** at parse time inside libpg-query — so by the time the AST
// reaches us the over-length name is already gone. The original source is
// preserved in the token stream, which is what we walk here.
const DEFAULT_MAX = 63;

interface Options {
  max?: number;
}

const byteLength = (s: string): number => Buffer.byteLength(s, "utf8");

// `"a""b"` is the SQL escape for the identifier `a"b`. PostgreSQL truncates
// the post-unescape form, so that is what we measure.
const unquoteIdentifier = (raw: string): string =>
  raw.slice(1, -1).replace(/""/g, '"');

const isQuotedIdentifier = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length >= 2 &&
  value.charCodeAt(0) === 0x22 /* " */ &&
  value.charCodeAt(value.length - 1) === 0x22;

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow identifiers longer than PostgreSQL's `NAMEDATALEN - 1` limit (default 63 bytes)",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: undefined,
    schema: [
      {
        type: "object",
        properties: {
          max: { type: "integer", minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      identifierTooLong:
        "Identifier `{{name}}` is {{length}} bytes, which exceeds the {{max}}-byte limit. PostgreSQL silently truncates over-length identifiers at parse time, so the object will be created (or looked up) under a different name than written — every later `DROP` / `ALTER` / `\\d` that uses the original name will then fail with `does not exist`.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as Options;
    const max = option.max ?? DEFAULT_MAX;
    const sourceCode = context.sourceCode;

    return {
      Program() {
        // The parser exposes every lexed token on `sourceCode.ast.tokens`.
        // Walking tokens (rather than AST nodes) is necessary because
        // libpg-query has already truncated over-length identifiers by the
        // time we see the AST; the token stream still carries the raw text
        // the user wrote.
        const tokens = (sourceCode.ast as { tokens?: AST.Token[] }).tokens;
        if (!Array.isArray(tokens)) return;
        const seen = new Set<number>();
        for (const token of tokens) {
          const range = token.range as [number, number] | undefined;
          if (!range || seen.has(range[0])) continue;
          seen.add(range[0]);
          let name: string | undefined;
          if (token.type === "Identifier") {
            name = typeof token.value === "string" ? token.value : undefined;
          } else if (
            token.type === "String" &&
            isQuotedIdentifier(token.value)
          ) {
            name = unquoteIdentifier(token.value);
          }
          if (name === undefined) continue;
          const length = byteLength(name);
          if (length <= max) continue;
          context.report({
            loc: token.loc,
            messageId: "identifierTooLong",
            data: { name, length: String(length), max: String(max) },
          });
        }
      },
    };
  },
};

export default rule;
