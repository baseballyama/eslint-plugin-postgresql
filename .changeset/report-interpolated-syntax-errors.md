---
"eslint-plugin-postgresql": patch
---

`no-syntax-error` now reports syntax errors in `sql` templates that contain a
`${...}`, such as `` sql`SELECT id,, name FROM users WHERE id = ${id}` ``.
Before, the `embedded-sql` processor skipped every such template that failed
to parse, because the identifier standing in for a `${...}` can itself be what
does not parse. It now skips a template only when the parse fails on that
identifier, or right after it at the end of the statement or on a reserved
word such as `SELECT` or `WHERE`: there, the `${...}` held a clause rather
than a value.
