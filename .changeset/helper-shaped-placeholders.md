---
"eslint-plugin-postgresql": patch
---

The `embedded-sql` processor now lints statements that use postgres.js's
`sql(...)` helpers, such as `WHERE id IN ${sql(ids)}`,
`INSERT INTO users ${sql(user)}` and `UPDATE users SET ${sql(user)}`. Before,
every `${...}` became a bare identifier, which cannot parse in those spots, so
the whole statement was silently skipped. A `${...}` there now stands in as
the list, rows or assignments it expands to.
