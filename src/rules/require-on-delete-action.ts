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

type Action = "CASCADE" | "RESTRICT" | "NO ACTION" | "SET NULL" | "SET DEFAULT";

const ALL_ACTIONS: readonly Action[] = [
  "CASCADE",
  "RESTRICT",
  "NO ACTION",
  "SET NULL",
  "SET DEFAULT",
];

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

const findOnDelete = (
  tokens: readonly MinimalToken[],
  start: number,
  end: number,
): number | null => {
  for (let i = start; i < end - 1; i++) {
    const a = tokens[i]!;
    const b = tokens[i + 1]!;
    if (
      a.type === "Keyword" &&
      a.value.toUpperCase() === "ON" &&
      b.type === "Keyword" &&
      b.value.toUpperCase() === "DELETE"
    ) {
      return i;
    }
  }
  return null;
};

// Read the action keyword(s) immediately after `ON DELETE`. Returns
// the action name (uppercased, with the two-word forms combined),
// the start token index, and the end token index (inclusive of the
// final action keyword).
const readAction = (
  tokens: readonly MinimalToken[],
  onIdx: number,
  end: number,
): { action: Action; from: number; to: number } | null => {
  const first = tokens[onIdx + 2];
  if (!first || onIdx + 2 >= end) return null;
  const a = first.value.toUpperCase();
  const second = tokens[onIdx + 3];
  const b = second ? second.value.toUpperCase() : null;
  if (a === "CASCADE")
    return { action: "CASCADE", from: onIdx + 2, to: onIdx + 2 };
  if (a === "RESTRICT")
    return { action: "RESTRICT", from: onIdx + 2, to: onIdx + 2 };
  if (a === "NO" && b === "ACTION")
    return { action: "NO ACTION", from: onIdx + 2, to: onIdx + 3 };
  if (a === "SET" && b === "NULL")
    return { action: "SET NULL", from: onIdx + 2, to: onIdx + 3 };
  if (a === "SET" && b === "DEFAULT")
    return { action: "SET DEFAULT", from: onIdx + 2, to: onIdx + 3 };
  return null;
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
    schema: [
      {
        type: "object",
        properties: {
          allowed: {
            type: "array",
            items: { enum: [...ALL_ACTIONS] },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingOnDelete:
        "Foreign-key constraint is missing an explicit `ON DELETE` clause; the implicit default is `NO ACTION`. Make the choice explicit so reviewers can see what happens to dependent rows.",
      disallowedAction:
        "`ON DELETE {{action}}` is not in the `allowed` list ({{allowedList}}). Either change the action or extend the rule's `allowed` option.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { allowed?: Action[] };
    const allowed = option.allowed;
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
        const onIdx = findOnDelete(tokens, startIdx, endIdx);
        if (onIdx === null) {
          context.report({
            loc: {
              start: tokens[startIdx]!.loc.start,
              end: tokens[endIdx - 1]?.loc.end ?? tokens[startIdx]!.loc.end,
            },
            messageId: "missingOnDelete",
          });
          return;
        }
        if (allowed == null) return;
        const act = readAction(tokens, onIdx, endIdx);
        if (!act) return;
        if (allowed.includes(act.action)) return;
        const from = tokens[act.from]!;
        const to = tokens[act.to]!;
        context.report({
          loc: { start: from.loc.start, end: to.loc.end },
          messageId: "disallowedAction",
          data: {
            action: act.action,
            allowedList: allowed.join(", "),
          },
        });
      },
    };
  },
};

export default rule;
