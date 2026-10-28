---
"eslint-plugin-postgresql": patch
---

`consistent-as-for-table-alias` now also checks the aliases of subqueries,
function calls and parenthesized joins, such as `FROM (SELECT ...) AS s` and
`JOIN unnest(...) AS u`. `consistent-as-for-column-alias` now also checks
`RETURNING` lists.
