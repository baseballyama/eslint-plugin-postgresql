---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-leading-wildcard-like` rule: warns on `LIKE`/`ILIKE` patterns that begin with `%`, which cannot use a B-tree index and force a sequential scan. Enabled at `warn` severity in `configs.recommended`.
