---
"eslint-plugin-postgresql": minor
---

Add `postgresql/prefer-text-over-varchar` rule: warns on `varchar(n)` and recommends `text` with a `CHECK` constraint when a length cap is needed. Enabled at `warn` severity in `configs.recommended`.
