---
"eslint-plugin-postgresql": minor
---

Add `postgresql/require-if-exists` (off by default; opt in via
`configs.all` or per project). Requires every top-level `DROP`
statement to include `IF EXISTS`, so re-running a migration on a
database that already lost the object does not abort with `ERROR:
table "foo" does not exist`.

Auto-fixable: inserts ` IF EXISTS` after the object-kind keyword
(`DROP TABLE foo;` → `DROP TABLE IF EXISTS foo;`). Covers `DropStmt`
(table, index, function, trigger, schema, ...), `DropdbStmt`,
`DropRoleStmt`, and `DropSubscriptionStmt`.
