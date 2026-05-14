---
"eslint-plugin-postgresql": patch
---

Four autofix correctness bugs reported against 0.6.0:

- **#140 fix:** `prefer-between-over-and` and `prefer-in-list-over-or`
  no longer drop the literal operand of cast expressions. The rules
  used `node.range` directly, but `TypeCast.range` covers only the
  `::` operator (or the `CAST` keyword) — so `'1900-01-01'::TIMESTAMPTZ`
  collapsed to just `::` in the rewrite, producing invalid SQL like
  `BETWEEN :: AND ::TIMESTAMPTZ`. Both rules now compute true source
  ranges by walking descendants.
- **#142 fix:** `align-column-definitions` now keeps `TYPE[]` (and
  `TYPE[3]`, `TYPE[][]`) together as a single alignment column, the
  same way `TIMESTAMP(3)` was already handled. The parser does not
  emit `[` / `]` as tokens, so the rule consumes any bracket suffix
  directly from the source text when `typeName.arrayBounds` is set.
- **#143 fix:** `require-trailing-semicolon` no longer inserts `;`
  in the middle of `NOT NULL` of the last column in a single-statement
  `CREATE TABLE`. The parser's per-statement `range[1]` is unreliable
  for single-statement files; the rule reverts to a file-level check
  ("the last source token must be `;`") which catches the original
  user intent without relying on internal-node ranges.
- **#144 fix:** `prefer-keyword-case` no longer uppercases identifier
  tokens whose spelling collides with a SQL keyword (`trigger`,
  `user`, `order`, ...). The rule now collects identifier positions
  from the AST (`ColumnDef`, `RangeVar`, `Constraint`) and skips
  `Keyword` tokens that land at one of those positions.
