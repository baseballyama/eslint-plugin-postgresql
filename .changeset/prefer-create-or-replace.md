---
"eslint-plugin-postgresql": minor
---

Add `postgresql/prefer-create-or-replace` (off by default; opt in via
`configs.all` or per project). Requires `CREATE FUNCTION`,
`CREATE PROCEDURE`, and `CREATE VIEW` to use the `OR REPLACE` form so
re-running a migration on a database that already defined the object
does not abort with `... already exists`.

Auto-fixable: inserts ` OR REPLACE` after the `CREATE` keyword.
