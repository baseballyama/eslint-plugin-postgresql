---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-truncate-cascade` rule: warns on `TRUNCATE ... CASCADE` because it transitively empties tables that have foreign keys referencing the target. Enabled at `warn` severity in `configs.recommended`.
