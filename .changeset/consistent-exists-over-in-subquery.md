---
"eslint-plugin-postgresql": minor
---

**BREAKING**: Renamed `prefer-exists-over-in-subquery` to `consistent-exists-over-in-subquery` and added a `style` option so users can enforce either stance with a single rule. The `style` option accepts:

- `"always"` (default): report `IN (subquery)` and `= ANY (subquery)`. This is the original behavior of `prefer-exists-over-in-subquery`.
- `"never"`: report a positive `EXISTS` that can be written as `IN`, and auto-fix it. `WHERE EXISTS (SELECT 1 FROM b WHERE b.a_id = a.id)` becomes `WHERE a.id IN (SELECT b.a_id FROM b)`. Only a `WHERE`, `ON` or `HAVING` condition outside `NOT` is rewritten, where both forms keep the same rows, and only when the sub-`SELECT` is tied to the outer query by exactly one `inner.col = outer.col` comparison.
