---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-numeric-without-precision` rule: warns on bare `NUMERIC` / `DECIMAL` column declarations and recommends declaring an explicit `NUMERIC(precision, scale)`. Enabled at `warn` severity in `configs.recommended`.
