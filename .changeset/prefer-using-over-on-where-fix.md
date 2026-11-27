---
"eslint-plugin-postgresql": minor
---

`prefer-using-over-on` now also fixes a join whose `ON` has conditions besides the same-named column pairs. It rewrites the pairs to `USING` and moves the other conditions to the start of the statement's `WHERE`, adding one after the `FROM` list when there is none. Like the report, this only applies to an inner join that no outer join encloses. Under a bare `SELECT *` / `RETURNING *`, on a joined side, or when a moved condition has an unqualified column that another `FROM` item could also have, the rewrite is a suggestion instead.

It also no longer crashes when a join condition starts with a positional parameter, as in `ON $1 = c.region_id AND c.customer_id = o.customer_id`. The bundled `postgresql-eslint-parser` is now 0.7.0, which gives `$1` a token of its own.
