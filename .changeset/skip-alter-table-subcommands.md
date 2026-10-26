---
"eslint-plugin-postgresql": patch
---

The `embedded-sql` processor now skips `ALTER TABLE` sub-commands that start
with a statement keyword, such as `` sql`DROP COLUMN ${sql(column)}` `` or a
bare `` sql`SET` ``. They are fragments of a larger statement, but were linted
as statements, so `no-syntax-error` reported them.
