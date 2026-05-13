---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-not-in-subquery` rule: errors on `NOT IN (subquery)` because a single NULL in the subquery yields zero rows. Literal `NOT IN (1, 2, 3)` lists are unaffected. Enabled at `error` severity in `configs.recommended`.
