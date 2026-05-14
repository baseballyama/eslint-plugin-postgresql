import type { Rule } from "eslint";

interface MinimalToken {
  type?: string;
  value: string;
  range: [number, number];
  loc: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

// Walk tokens forward from `startIndex` until we leave the foreign-key
// clause: a `,` or `;` at paren-depth 0, or a closing paren that
// brings us below depth 0. Return the *index in `tokens`* of the
// first stop token (or tokens.length if none found), so callers can
// inspect the slice [startIndex, stopIndex) for `ON DELETE`.
const findFkClauseEnd = (
  tokens: readonly MinimalToken[],
  startIndex: number,
): number => {
  let depth = 0;
  for (let i = startIndex; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t.value === "(") depth++;
    else if (t.value === ")") {
      if (depth === 0) return i;
      depth--;
    } else if (depth === 0 && (t.value === "," || t.value === ";")) {
      return i;
    }
  }
  return tokens.length;
};

const hasOnDelete = (
  tokens: readonly MinimalToken[],
  start: number,
  end: number,
): boolean => {
  for (let i = start; i < end - 1; i++) {
    const a = tokens[i]!;
    const b = tokens[i + 1]!;
    if (
      a.type === "Keyword" &&
      a.value.toUpperCase() === "ON" &&
      b.type === "Keyword" &&
      b.value.toUpperCase() === "DELETE"
    ) {
      return true;
    }
  }
  return false;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require an explicit `ON DELETE` clause on every foreign-key constraint",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      missingOnDelete:
        "Foreign-key constraint is missing an explicit `ON DELETE` clause; the implicit default is `NO ACTION`. Make the choice explicit so reviewers can see what happens to dependent rows.",
    },
  },
  create(context) {
    return {
      Constraint(node: { contype?: string; range?: [number, number] }) {
        if (node.contype !== "CONSTR_FOREIGN") return;
        if (!node.range) return;
        const tokens = (context.sourceCode.ast.tokens ?? []) as MinimalToken[];
        // Find the first token whose start is at or after the FK
        // constraint's reported start. The constraint's range covers
        // only `CONSTRAINT name` or `REFERENCES other`, so we then
        // walk forward through the tokens belonging to the same FK
        // clause and look for `ON DELETE`.
        const startIdx = tokens.findIndex((t) => t.range[0] >= node.range![0]);
        if (startIdx < 0) return;
        const endIdx = findFkClauseEnd(tokens, startIdx);
        if (hasOnDelete(tokens, startIdx, endIdx)) return;
        context.report({
          loc: {
            start: tokens[startIdx]!.loc.start,
            end: tokens[endIdx - 1]?.loc.end ?? tokens[startIdx]!.loc.end,
          },
          messageId: "missingOnDelete",
        });
      },
    };
  },
};

export default rule;
