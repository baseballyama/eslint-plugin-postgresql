---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-unlogged-table` rule: warns on `CREATE UNLOGGED TABLE` because unlogged tables are truncated on crash, not replicated, and not restored from base backups. Enabled at `warn` severity in `configs.recommended`.
