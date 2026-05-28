---
"eslint-plugin-postgresql": patch
---

`postgresql/prefer-keyword-case`: add an after-dot token guard so dotted column references don't have their trailing field uppercased.

Follow-up to the keyword-case identifier-corruption fix. The plugin's `ColumnRef` range-contains check covers most identifier positions, but the parser's `ColumnRef.range` for a dotted expression like `kv.key` / `t.date` only spans the first segment — the second field (`key`, `date`) sits outside any AST-derived identifier range. The rule used to case-fold it, corrupting `kv.key` into `kv.KEY`.

The fix scans tokens in order and exempts every Keyword whose previous non-trivial token is `.` (with the `..` range-operator exception). Same guard already used by `postgresql/plpgsql-keyword-case` for PL/pgSQL bodies.
