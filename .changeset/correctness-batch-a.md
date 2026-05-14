---
"eslint-plugin-postgresql": minor
---

Five new correctness rules. Four are added to `configs.recommended` at
`warn` (or `error` for the safety-critical one); the fifth parallels
`prefer-create-index-concurrently` and is off by default.

- `no-rule` — disallow `CREATE RULE`; PostgreSQL's rule system has
  surprising semantics around row counts and `RETURNING`. Prefer a
  trigger or an updatable view. (warn)
- `no-on-delete-cascade` — disallow `ON DELETE CASCADE` on foreign keys;
  the propagation is silent and can wipe out far more rows than the
  author intended. Use `RESTRICT` / `SET NULL` and clean up explicitly.
  (warn)
- `no-with-recursive-without-limit` — disallow `WITH RECURSIVE` queries
  whose outer `SELECT` has no `LIMIT`; protects against unbounded
  execution when the recursion's termination condition is wrong.
  (error)
- `prefer-add-constraint-not-valid` — `ALTER TABLE ... ADD CONSTRAINT
... CHECK / FOREIGN KEY` should use `NOT VALID` so the validating
  scan does not hold `ACCESS EXCLUSIVE` on the full table; run
  `VALIDATE CONSTRAINT` separately. (warn)
- `prefer-drop-index-concurrently` — mirror of
  `prefer-create-index-concurrently`. Off by default.
