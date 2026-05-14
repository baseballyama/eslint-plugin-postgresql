import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import { isColumnDef, isConstraint } from "../utils/ast.js";

// Default minimum number of spaces between adjacent fields when
// aligning. Two spaces matches the convention in the user-supplied
// example and is comfortably wide enough to be visually distinct.
const DEFAULT_GAP = 2;

interface Slot {
  node: Ast.ColumnDef;
  name: string;
  typeText: string;
  // Source text from the position right after the type to the end of
  // the last constraint. Empty string if the column has no constraints.
  constraintsText: string;
  // The full source range that this rule will rewrite. Starts at the
  // column name and ends at the last constraint (or at the end of the
  // type if there are no constraints).
  rewriteStart: number;
  rewriteEnd: number;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Align column definitions vertically inside `CREATE TABLE` so that name, type, and constraints share consistent column offsets",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          gap: { type: "integer", minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      misaligned:
        "Column definitions in this CREATE TABLE are not vertically aligned.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    const option = (context.options[0] ?? {}) as { gap?: number };
    const gap = option.gap ?? DEFAULT_GAP;
    return {
      CreateStmt(node: Ast.CreateStmt) {
        const elts = node.tableElts;
        if (!Array.isArray(elts) || elts.length === 0) return;

        // Table-level constraints (`PRIMARY KEY (a, b)`, `CHECK (...)`,
        // etc.) are kept as-is — only ColumnDef rows are realigned. Walk
        // every element so we still bail out on multi-line column defs
        // and shared-line layouts, where source surgery is unsafe.
        const slots: Slot[] = [];
        const seenLines = new Set<number>();
        const tokens = sourceCode.ast.tokens ?? [];
        for (const elt of elts) {
          if (!isColumnDef(elt)) continue;
          const colRange = elt.range;
          const typeName = elt.typeName as
            | {
                range?: [number, number];
                typmods?: { range?: [number, number] }[];
                arrayBounds?: unknown[];
              }
            | undefined;
          const baseTypeRange = typeName?.range;
          if (!colRange || !baseTypeRange) return;
          // The parser's `typeName.range` covers only the bare type
          // name. Two postfix shapes need the type span extended:
          // - `TYPE(precision)` — the modifiers live in `typmods`;
          //   walk past the closing `)` after the last typmod.
          // - `TYPE[]` (and `TYPE[][]`, `TYPE[3]`, ...) — the array
          //   suffix is signaled by a non-empty `arrayBounds` array
          //   but its individual entries do not carry usable ranges,
          //   so walk forward token-by-token consuming `[ ... ]`
          //   pairs as long as they are adjacent to the type.
          let typeEnd = baseTypeRange[1];
          const lastTypmod = typeName?.typmods?.at(-1);
          if (lastTypmod?.range) {
            const closingParen = tokens.find(
              (t) => t.range[0] >= lastTypmod.range![1] && t.value === ")",
            );
            if (closingParen) typeEnd = closingParen.range[1];
          }
          if (
            Array.isArray(typeName?.arrayBounds) &&
            typeName.arrayBounds.length > 0
          ) {
            // The parser tokenizer does not emit `[` / `]` as tokens,
            // so consume array suffixes (`[]`, `[3]`, `[][2]`, ...)
            // straight from the source text: eat any number of bracket
            // groups starting at typeEnd, allowing digits inside.
            const text = sourceCode.getText();
            const bracketSuffix = /^(?:\[\d*\])+/;
            const match = text.slice(typeEnd).match(bracketSuffix);
            if (match) typeEnd += match[0].length;
          }
          const typeRange: [number, number] = [baseTypeRange[0], typeEnd];
          const constraints = Array.isArray(elt.constraints)
            ? elt.constraints.filter(isConstraint)
            : [];
          const lastConstraint = constraints.at(-1);
          const rewriteEnd = lastConstraint?.range
            ? lastConstraint.range[1]
            : typeRange[1];
          const startLoc = sourceCode.getLocFromIndex(colRange[0]);
          const endLoc = sourceCode.getLocFromIndex(rewriteEnd);
          if (startLoc.line !== endLoc.line) return;
          if (seenLines.has(startLoc.line)) return;
          seenLines.add(startLoc.line);

          // A `--` or `/* */` comment AFTER the rewrite range is fine —
          // the rule only replaces [name..lastConstraint] and never
          // touches the trailing comma or comment that follows.
          // Reject only when a comment lives INSIDE the rewrite span
          // (e.g. `id /* annotation */ ulid PRIMARY KEY`), since that
          // text would be clobbered by the realigned line.
          const rewriteSpanText = sourceCode
            .getText()
            .slice(colRange[0], rewriteEnd);
          if (
            rewriteSpanText.includes("--") ||
            rewriteSpanText.includes("/*")
          ) {
            return;
          }

          const typeText = sourceCode
            .getText()
            .slice(typeRange[0], typeRange[1]);
          // Collapse runs of whitespace inside the constraint span so a
          // misaligned input like `... IDENTITY        PRIMARY KEY` is
          // normalized to single-space separation before re-emitting.
          // Without this, the source-level alignment of the input
          // bleeds back into the output even though the rule otherwise
          // recomputes the column-to-column padding.
          const constraintsText = lastConstraint?.range
            ? sourceCode
                .getText()
                .slice(typeRange[1], lastConstraint.range[1])
                .replace(/\s+/g, " ")
                .trim()
            : "";

          slots.push({
            node: elt,
            name: elt.colname ?? "",
            typeText,
            constraintsText,
            rewriteStart: colRange[0],
            rewriteEnd,
          });
        }
        if (slots.length < 2) return;

        const maxName = Math.max(...slots.map((s) => s.name.length));
        const maxType = Math.max(...slots.map((s) => s.typeText.length));

        let firstMisaligned: Slot | undefined;
        const rewrites: Array<{ slot: Slot; replacement: string }> = [];
        for (const slot of slots) {
          const namePart = slot.name.padEnd(maxName);
          const typePart = slot.constraintsText
            ? slot.typeText.padEnd(maxType)
            : slot.typeText;
          const expected = slot.constraintsText
            ? `${namePart}${" ".repeat(gap)}${typePart}${" ".repeat(gap)}${slot.constraintsText}`
            : `${namePart}${" ".repeat(gap)}${typePart}`;
          const current = sourceCode
            .getText()
            .slice(slot.rewriteStart, slot.rewriteEnd);
          if (current === expected) continue;
          if (!firstMisaligned) firstMisaligned = slot;
          rewrites.push({ slot, replacement: expected });
        }
        if (rewrites.length === 0 || !firstMisaligned) return;

        context.report({
          loc: {
            start: sourceCode.getLocFromIndex(firstMisaligned.rewriteStart),
            end: sourceCode.getLocFromIndex(firstMisaligned.rewriteEnd),
          },
          messageId: "misaligned",
          fix(fixer) {
            return rewrites.map(({ slot, replacement }) =>
              fixer.replaceTextRange(
                [slot.rewriteStart, slot.rewriteEnd],
                replacement,
              ),
            );
          },
        });
      },
    };
  },
};

export default rule;
