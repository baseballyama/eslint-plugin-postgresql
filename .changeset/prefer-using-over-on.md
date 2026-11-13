---
"eslint-plugin-postgresql": minor
---

Added `prefer-using-over-on`, which prefers `JOIN ... USING (col)` over `JOIN ... ON a.col = b.col`. It is off by default and included in `configs.all`.

- When every `ON` condition matches a column to the same-named column on the other side, the rule rewrites the `ON` to `USING`. It reports without fixing under a bare `SELECT *` / `RETURNING *` or an aliased parenthesized join, where merging the columns would change the output.
- When there are other conditions too, it reports that they belong in `WHERE`, without a fix. It does this only for an inner join that no outer join encloses.
- By default it only checks joins between two single `FROM` items, since `USING` needs each column exactly once on each side. `checkJoinedSides: true` also reports joins whose side is itself a join, without a fix.
