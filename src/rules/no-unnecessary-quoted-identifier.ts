import type { Rule } from "eslint";
import { PG_KEYWORDS_REQUIRING_QUOTES } from "../utils/pg-keywords.js";

// PostgreSQL unquoted identifiers are case-folded to lowercase. So
// `"Foo"` and `Foo` (which folds to `foo`) are different identifiers,
// and stripping the quotes from `"Foo"` would silently rename the
// object. To keep the autofix lossless, only unquote when the inner
// text is already exclusively lowercase.
const SAFE_UNQUOTED = /^[a-z_][a-z0-9_$]*$/;

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        'Disallow unnecessary double-quoting of identifiers (e.g. `"users"` when `users` would mean the same thing)',
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [],
    messages: {
      unnecessaryQuoting:
        'The identifier `"{{inner}}"` does not need quoting; `{{inner}}` means the same thing.',
    },
  },
  create(context) {
    return {
      Program() {
        const tokens = context.sourceCode.ast.tokens ?? [];
        for (const token of tokens) {
          // The parser emits `"..."` as a String-typed token; we
          // distinguish it from a `'...'` literal by the opening quote.
          if (token.value[0] !== '"') continue;
          if (token.value.length < 2 || token.value.at(-1) !== '"') continue;
          const raw = token.value.slice(1, -1);
          // Doubled quotes inside a quoted identifier are an embedded
          // `"`. Anything containing a real `"` cannot be unquoted.
          if (raw.includes('""')) continue;
          if (!SAFE_UNQUOTED.test(raw)) continue;
          if (PG_KEYWORDS_REQUIRING_QUOTES.has(raw)) continue;
          context.report({
            loc: token.loc,
            messageId: "unnecessaryQuoting",
            data: { inner: raw },
            fix: (fixer) => fixer.replaceTextRange(token.range, raw),
          });
        }
      },
    };
  },
};

export default rule;
