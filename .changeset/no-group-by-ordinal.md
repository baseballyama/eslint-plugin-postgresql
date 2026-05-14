---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-group-by-ordinal` rule: warns on positional `GROUP BY` references like `GROUP BY 1, 2`, which silently shift to a different column when the SELECT list is reordered. Enabled at `warn` severity in `configs.recommended`.
