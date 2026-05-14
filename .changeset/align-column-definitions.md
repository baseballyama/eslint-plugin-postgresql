---
"eslint-plugin-postgresql": minor
---

Add `postgresql/align-column-definitions` (in `configs.stylistic`,
auto-fixable).

Aligns column definitions inside a `CREATE TABLE` so that name, type,
and constraints share consistent column offsets across rows. Two-space
gap between fields, computed from the longest name and longest type in
the table.

Conservative on purpose: skips tables that mix column definitions with
table-level constraints, tables that have multi-line column defs, and
lines that carry inline `--` or `/*` comments. These cases need more
careful source surgery and are deferred.
