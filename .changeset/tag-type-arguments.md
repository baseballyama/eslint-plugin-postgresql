---
"eslint-plugin-postgresql": patch
---

The `embedded-sql` processor now lints templates whose tag has type
arguments, such as ``sql<Row[]>`...` `` or ``prisma.$queryRaw<User[]>`...` ``.
Before, the closing `>` was taken as the tag, so these templates were skipped.
