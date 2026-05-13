---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-grant-to-public` rule: warns on `GRANT ... TO PUBLIC` because PUBLIC covers every current and future role. `REVOKE ... FROM PUBLIC` is unaffected. Enabled at `warn` severity in `configs.recommended`.
