---
"eslint-plugin-postgresql": patch
---

Remove the unused `libpg-query` dependency. SQL is parsed by the bundled
`postgresql-eslint-parser`, which loads `@libpg-query/parser` instead, so
nothing imported `libpg-query`. Installs no longer download it or its
`@pgsql/types`, and the plugin behaves the same.
