---
"eslint-plugin-postgresql": minor
---

Add `postgresql/prefer-identity-over-serial` rule: warns on `SMALLSERIAL`, `SERIAL`, `BIGSERIAL` columns and recommends `GENERATED ALWAYS AS IDENTITY`. Enabled at `warn` severity in `configs.recommended`.
