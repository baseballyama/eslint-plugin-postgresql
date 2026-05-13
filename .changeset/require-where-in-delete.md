---
"eslint-plugin-postgresql": minor
---

Add `postgresql/require-where-in-delete` rule: errors on `DELETE` statements without a `WHERE` clause to prevent accidentally emptying tables. Enabled at `error` severity in `configs.recommended`.
