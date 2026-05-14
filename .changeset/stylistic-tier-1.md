---
"eslint-plugin-postgresql": minor
---

Add four token-walking stylistic rules to `configs.stylistic`, all auto-
fixable:

- `prefer-not-equals-operator` — enforce a single style for the not-equal
  operator (`<>` or `!=`); default `<>`.
- `prefer-current-timestamp-over-now` — rewrite `now()` to the SQL-standard
  `CURRENT_TIMESTAMP`.
- `prefer-explicit-inner-join` — rewrite bare `JOIN` to `INNER JOIN`.
- `prefer-explicit-outer-join` — rewrite `LEFT|RIGHT|FULL JOIN` to
  `LEFT|RIGHT|FULL OUTER JOIN`.

Bumps `postgresql-eslint-parser` to `^0.2.0` so dollar-quoted PL/pgSQL
bodies no longer leak spurious tokens into rule visitors.
