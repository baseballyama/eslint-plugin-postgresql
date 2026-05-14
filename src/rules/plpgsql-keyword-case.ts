import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { PLPGSQL_KEYWORDS } from "../utils/pg-keywords.js";

type CaseStyle = "upper" | "lower";

const DEFAULT_CASE: CaseStyle = "upper";

// Match PL/pgSQL bodies that the parser tagged as `plpgsql`. The parser
// lower-cases the LANGUAGE clause, so we compare in lower-case here.
const PLPGSQL = "plpgsql";

// One pass identifies the spans we must NOT touch (string literals,
// comments) inside the body, then a second pass walks identifier-shaped
// runs and reports those that match a known keyword.
type SkipRange = readonly [number, number];

const collectSkipRanges = (source: string): SkipRange[] => {
  const skip: SkipRange[] = [];
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === "'") {
      const start = i;
      i++;
      while (i < source.length) {
        if (source[i] === "'") {
          if (source[i + 1] === "'") {
            i += 2;
            continue;
          }
          i++;
          break;
        }
        i++;
      }
      skip.push([start, i]);
    } else if (c === "-" && source[i + 1] === "-") {
      const start = i;
      while (i < source.length && source[i] !== "\n") i++;
      skip.push([start, i]);
    } else if (c === "/" && source[i + 1] === "*") {
      const start = i;
      i += 2;
      while (
        i < source.length - 1 &&
        !(source[i] === "*" && source[i + 1] === "/")
      ) {
        i++;
      }
      i += 2;
      skip.push([start, Math.min(i, source.length)]);
    }
  }
  return skip;
};

const isInSkip = (offset: number, skip: SkipRange[]): boolean => {
  for (const [s, e] of skip) {
    if (offset >= s && offset < e) return true;
  }
  return false;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Enforce a consistent case (upper or lower) for SQL and PL/pgSQL keywords inside PL/pgSQL function bodies",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          case: { enum: ["upper", "lower"] },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      expectedUpper:
        "PL/pgSQL keyword '{{actual}}' should be uppercase: '{{expected}}'.",
      expectedLower:
        "PL/pgSQL keyword '{{actual}}' should be lowercase: '{{expected}}'.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { case?: CaseStyle };
    const target: CaseStyle = option.case ?? DEFAULT_CASE;
    const messageId = target === "upper" ? "expectedUpper" : "expectedLower";
    const transform = (value: string) =>
      target === "upper" ? value.toUpperCase() : value.toLowerCase();

    return {
      EmbeddedCode(node: Ast.EmbeddedCode) {
        if (node.language?.toLowerCase() !== PLPGSQL) return;
        const range = node.range;
        if (!range) return;
        const source = node.source ?? "";
        const skip = collectSkipRanges(source);

        const wordRe = /[a-zA-Z_][a-zA-Z0-9_]*/g;
        let match: RegExpExecArray | null;
        while ((match = wordRe.exec(source)) !== null) {
          const word = match[0];
          const startInBody = match.index;
          if (isInSkip(startInBody, skip)) continue;
          const lower = word.toLowerCase();
          if (!PLPGSQL_KEYWORDS.has(lower)) continue;
          const expected = transform(word);
          if (word === expected) continue;
          const absStart = range[0] + startInBody;
          const absEnd = absStart + word.length;
          const startLoc = context.sourceCode.getLocFromIndex(absStart);
          const endLoc = context.sourceCode.getLocFromIndex(absEnd);
          context.report({
            loc: { start: startLoc, end: endLoc },
            messageId,
            data: { actual: word, expected },
            fix: (fixer) =>
              fixer.replaceTextRange([absStart, absEnd], expected),
          });
        }
      },
    };
  },
};

export default rule;
