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
              }
            | undefined;
          const baseTypeRange = typeName?.range;
          if (!colRange || !baseTypeRange) return;
          // The parser's `typeName.range` covers only the bare type
          // name. For parameterized types like `TIMESTAMP(3)` or
          // `NUMERIC(10, 2)`, the modifier list lives in `typmods`; we
          // extend the type span through the closing `)` so the rule
          // sees the whole `TYPE(...)` as one alignment column.
          let typeEnd = baseTypeRange[1];
          const lastTypmod = typeName?.typmods?.at(-1);
          if (lastTypmod?.range) {
            const closingParen = tokens.find(
              (t) => t.range[0] >= lastTypmod.range![1] && t.value === ")",
            );
            if (closingParen) typeEnd = closingParen.range[1];
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

          const lineText = sourceCode.lines[startLoc.line - 1] ?? "";
          // Reject lines that carry inline comments or any unexpected
          // text in the rewrite span; we cannot safely reflow them.
          if (lineText.includes("--") || lineText.includes("/*")) return;

          const typeText = sourceCode
            .getText()
            .slice(typeRange[0], typeRange[1]);
          const constraintsText = lastConstraint?.range
            ? sourceCode
                .getText()
                .slice(typeRange[1], lastConstraint.range[1])
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
