---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-cluster` rule: warns on the `CLUSTER` statement because it takes `ACCESS EXCLUSIVE`, rewrites the table, and PostgreSQL does not keep rows clustered as you continue to write. Use `pg_repack --order-by` for online clustering. Enabled at `warn` severity in `configs.recommended`.
