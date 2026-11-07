---
"eslint-plugin-postgresql": minor
---

The embedded-SQL processor now names each virtual file after its template's tag,
so ``db.sql`...` `` in `src/db.ts` is linted as `src/db.ts/0_db.sql.sql` instead
of `src/db.ts/0_0.sql`. A config block can use that name to turn rules off for
one tag's templates, such as `files: ["**/*_warehouse.sql.sql"]`.
