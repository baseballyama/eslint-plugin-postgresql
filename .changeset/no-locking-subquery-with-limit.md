---
"eslint-plugin-postgresql": minor
---

feat: add `no-locking-subquery-with-limit` rule (recommended: `error`)

Flags `UPDATE` / `DELETE` statements whose `IN (...)`, `EXISTS (...)` or
scalar sub-`SELECT` carries both a row-locking clause and `LIMIT` / `OFFSET`.
PostgreSQL re-executes such a sub-`SELECT` for every candidate row, and each
re-execution skips the rows the statement already modified — so the limit
stops bounding how many rows are modified and the statement can touch the
whole table (PostgreSQL BUG #15715). Move the sub-`SELECT` into a `WITH`
clause, which PostgreSQL evaluates exactly once.
