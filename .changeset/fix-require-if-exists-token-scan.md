---
"eslint-plugin-postgresql": patch
---

`postgresql/require-if-exists`: constrain the `DROP` keyword search to the visited node's own range.

The previous implementation scanned every token in the file with a module-scoped cursor, which let the visitor land on a `DROP` keyword that belonged to an unrelated `ALTER TABLE ... DROP CONSTRAINT` / `DROP COLUMN` and apply the `IF EXISTS` fix there. Worse, ESLint's `--fix` loop re-parsed the corrupted file and inserted a second `IF EXISTS`, producing `DROP CONSTRAINT IF EXISTS IF EXISTS ...` syntax errors that broke fresh-DB replays.

postgresql-eslint-parser >= 0.5.3 anchors top-level statement ranges via `stmt_location` / `stmt_len` (including the first statement, whose `stmt_location` libpg-query omits from the JSON output), so `node.range` is now reliable. The rule constrains its token search to that range, and the visitor only matches the `DROP` keyword that opens the visited statement.

Bumped the peer dependency on `postgresql-eslint-parser` to `^0.5.3`.
