---
"eslint-plugin-postgresql": patch
---

`require-limit` no longer flags a `SELECT` with no `FROM` clause. Queries like
`SELECT pg_advisory_xact_lock($1)`, `SELECT set_config(...)` and `SELECT 1`
return exactly one row, so there is nothing for `LIMIT` to bound. Set
operations still report, since their arms can return many rows.
