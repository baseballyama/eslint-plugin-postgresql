---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-select-into` rule: warns on `SELECT ... INTO target FROM ...`, which silently creates a new table and is confusable with PL/pgSQL's row-assignment form. Prefer `CREATE TABLE target AS SELECT ...`. Enabled at `warn` severity in `configs.recommended`.
