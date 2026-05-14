---
"eslint-plugin-postgresql": patch
---

Closes #159: `require-limit` no longer fires on
`INSERT INTO ... VALUES (...)`. libpg-query rewrites the `VALUES`
list as a synthetic `SelectStmt` with a populated `valuesLists`, and
the rule now recognizes that shape and skips it.
