---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-update-primary-key` (in `configs.recommended` at
`error`).

Visits `UpdateStmt` and flags any `SET <pk> = ...` where `<pk>` matches
a heuristic for "this is the table's primary-key column":

- The literal name `id` (configurable via the `pkColumnNames` option).
- The pattern `<table>_id` (auto-derived per statement from
  `relation.relname`).

Primary keys are intended to be immutable — FK references, audit logs,
and external systems can hold the old value. Without schema knowledge
the rule has to guess; the heuristic is intentionally narrow and the
option lets a project add its own conventions (`uuid`, `<table>_pk`,
etc.).
