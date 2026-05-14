---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-order-by-ordinal` rule: warns on positional `ORDER BY` references like `ORDER BY 1, 2`, which silently break when the SELECT list changes. Enabled at `warn` severity in `configs.recommended`.
