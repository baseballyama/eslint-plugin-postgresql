---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-temporary-table` rule: warns on `CREATE TEMP/TEMPORARY TABLE` in versioned SQL because temporary tables exist only for the current session and almost never belong in migration files. Enabled at `warn` severity in `configs.recommended`.
