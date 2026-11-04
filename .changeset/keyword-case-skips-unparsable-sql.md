---
"eslint-plugin-postgresql": patch
---

`prefer-keyword-case` no longer reports names that spell a keyword, such as a
`uuid` or `table_name` column or an `int` cast, in SQL that fails to parse.
Without a syntax tree it cannot tell a name from a keyword, so it now skips
that SQL until it parses. This includes `sql` templates whose `${...}` holds a
clause, which `prefer-keyword-case` checked since 0.25.4.
