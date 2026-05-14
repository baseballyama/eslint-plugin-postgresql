---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-having-without-group-by` rule: errors when a `SELECT` uses `HAVING` with no `GROUP BY`, which collapses the query to a single aggregate row over the whole table. Enabled at `error` severity in `configs.recommended`.
