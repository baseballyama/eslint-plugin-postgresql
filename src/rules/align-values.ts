import type { Rule } from "eslint";
import { getFullSourceRange } from "../utils/ast.js";

const DEFAULT_GAP = 1;

interface Row {
  // The row's items, in source order.
  items: { range: [number, number] }[];
  // Source-text values for each item, computed up-front.
  itemTexts: string[];
  // Range that the rule will rewrite (first item start → last item
  // end). Commas and the surrounding `(` / `)` are NOT touched.
  rewriteStart: number;
  rewriteEnd: number;
  // Line number of the row's first item; used to enforce single-line.
  line: number;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Align column values vertically inside multi-row `INSERT ... VALUES (...)` so that each tuple position shares a consistent width across rows",
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
        "VALUES rows are not vertically aligned: column widths can shrink to fit the current rows.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    const option = (context.options[0] ?? {}) as { gap?: number };
    const gap = option.gap ?? DEFAULT_GAP;

    const considerInsert = (selectStmt: unknown): void => {
      if (!selectStmt || typeof selectStmt !== "object") return;
      const ss = selectStmt as { valuesLists?: unknown[] };
      const lists = ss.valuesLists;
      if (!Array.isArray(lists) || lists.length < 2) return;

      const rows: Row[] = [];
      let columnCount: number | null = null;
      for (const list of lists) {
        if (!list || typeof list !== "object") return;
        const items = (list as { items?: unknown[] }).items;
        if (!Array.isArray(items) || items.length === 0) return;
        if (columnCount === null) columnCount = items.length;
        else if (items.length !== columnCount) return;

        const itemRanges: { range: [number, number] }[] = [];
        for (const it of items) {
          const r = getFullSourceRange(it);
          if (!r) return;
          itemRanges.push({ range: r });
        }
        const first = itemRanges[0]!;
        const last = itemRanges.at(-1)!;
        const startLoc = sourceCode.getLocFromIndex(first.range[0]);
        const endLoc = sourceCode.getLocFromIndex(last.range[1]);
        if (startLoc.line !== endLoc.line) return;

        const lineText = sourceCode.lines[startLoc.line - 1] ?? "";
        // Inline comments would be clobbered by a per-row rewrite.
        if (lineText.includes("--") || lineText.includes("/*")) return;

        const itemTexts = itemRanges.map((r) =>
          sourceCode.getText().slice(r.range[0], r.range[1]),
        );
        rows.push({
          items: itemRanges,
          itemTexts,
          rewriteStart: first.range[0],
          rewriteEnd: last.range[1],
          line: startLoc.line,
        });
      }
      if (rows.length < 2 || columnCount === null) return;

      // Per-column max width across all rows. The last column is not
      // padded — nothing follows it before `)`.
      const widths = new Array<number>(columnCount).fill(0);
      for (const row of rows) {
        for (let i = 0; i < columnCount; i++) {
          const w = row.itemTexts[i]!.length;
          if (w > widths[i]!) widths[i] = w;
        }
      }

      let firstMisaligned: Row | undefined;
      const rewrites: Array<{ row: Row; replacement: string }> = [];
      for (const row of rows) {
        // Per-column emission: value + comma immediately, then enough
        // spaces so the *next* column's first character aligns across
        // all rows. The trailing comma is part of the padded segment
        // (so `'GPT-5',     '2026'` lines up with
        //  `'GPT-5 Mini', '2026'`). Last column emits the value alone.
        const expectedParts: string[] = [];
        for (let i = 0; i < columnCount; i++) {
          const text = row.itemTexts[i]!;
          if (i === columnCount - 1) {
            expectedParts.push(text);
          } else {
            const padTo = widths[i]! + 1 + gap; // value + ',' + gap
            expectedParts.push(`${text},`.padEnd(padTo));
          }
        }
        const expected = expectedParts.join("");
        const current = sourceCode
          .getText()
          .slice(row.rewriteStart, row.rewriteEnd);
        if (current === expected) continue;
        if (!firstMisaligned) firstMisaligned = row;
        rewrites.push({ row, replacement: expected });
      }
      if (rewrites.length === 0 || !firstMisaligned) return;

      context.report({
        loc: {
          start: sourceCode.getLocFromIndex(firstMisaligned.rewriteStart),
          end: sourceCode.getLocFromIndex(firstMisaligned.rewriteEnd),
        },
        messageId: "misaligned",
        fix(fixer) {
          return rewrites.map(({ row, replacement }) =>
            fixer.replaceTextRange(
              [row.rewriteStart, row.rewriteEnd],
              replacement,
            ),
          );
        },
      });
    };

    return {
      InsertStmt(node: { selectStmt?: unknown }) {
        considerInsert(node.selectStmt);
      },
    };
  },
};

export default rule;
