---
"eslint-plugin-postgresql": minor
---

Two new structural-rewrite rules in `configs.stylistic`, both
auto-fixable:

- `prefer-in-list-over-or` — collapse `x = 1 OR x = 2 OR x = 3` into
  `x IN (1, 2, 3)`. Triggers only when every disjunct is an equality
  on the same lexpr (compared by source text).
- `prefer-between-over-and` — rewrite `x >= a AND x <= b` as
  `x BETWEEN a AND b`. Strict inequalities (`> / <`) are not flagged
  because they are not equivalent to `BETWEEN`.

`prefer-cast-operator` (`CAST(x AS int)` ↔ `x::int`) is intentionally
deferred: the parser exposes only a partial range for qualified type
names, so a safe rewrite needs token-level boundary detection that is
its own piece of work.
