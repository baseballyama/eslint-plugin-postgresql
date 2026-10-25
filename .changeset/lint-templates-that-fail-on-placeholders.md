---
"eslint-plugin-postgresql": patch
---

The `embedded-sql` processor no longer skips a template that fails to parse
because a `${...}` holds a clause, such as
`` sql`SELECT * FROM orders JOIN users ${on} WHERE id != 1` ``. Rules that
read tokens rather than the syntax tree, such as `prefer-keyword-case` and
`prefer-not-equals-operator`, now check it. Its syntax error is still not
reported, since the `${...}` caused it.
