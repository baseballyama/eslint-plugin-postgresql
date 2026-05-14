---
"eslint-plugin-postgresql": minor
---

Add `postgresql/prefer-explicit-null-ordering` rule: warns when an `ORDER BY` term specifies an explicit `ASC`/`DESC` direction but no `NULLS FIRST` / `NULLS LAST`. Plain `ORDER BY x` (no direction) is left alone. Enabled at `warn` severity in `configs.recommended`.
