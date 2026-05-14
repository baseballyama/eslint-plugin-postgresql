---
"eslint-plugin-postgresql": minor
---

Add `postgresql/prefer-coalesce-over-case` rule: flags `CASE WHEN x IS NULL THEN y ELSE x END` (and its `IS NOT NULL` mirror) and recommends the equivalent `COALESCE(x, y)`. Enabled at `warn` severity in `configs.recommended`.
