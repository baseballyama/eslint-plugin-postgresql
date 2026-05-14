---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-distinct-on-without-order-by` rule: errors when `SELECT DISTINCT ON (...)` is used without `ORDER BY`. Without an ordering, the surviving row in each group is arbitrary and depends on scan order. Enabled at `error` severity in `configs.recommended`.
