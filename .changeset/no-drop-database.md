---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-drop-database` rule: errors on `DROP DATABASE`, which is catastrophic and irreversible and should not live in versioned SQL applied unattended by a migration tool. Enabled at `error` severity in `configs.recommended`.
