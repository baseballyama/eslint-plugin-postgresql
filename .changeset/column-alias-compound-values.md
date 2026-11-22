---
"eslint-plugin-postgresql": patch
---

`consistent-as-for-column-alias` now also checks aliases after dotted columns,
function calls, subscripts and `CASE` expressions, such as `t.id AS user_id`,
`count(*) total` and `CASE ... END AS status`. With `style: "never"`, it no
longer removes an `AS` that PostgreSQL needs: before a keyword it accepts as a
column alias only after `AS` (the fix turned `SELECT 1 AS month` into
`SELECT 1 month`, which is a syntax error), and before a keyword that can
continue the expression, such as `SELECT x + y AS at`. With `style: "always"`,
it no longer turns `x::date date` into `x::AS date date`.
