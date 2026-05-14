---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-rename-column` rule: warns on `ALTER TABLE ... RENAME COLUMN` because every running app instance that still references the old name errors the moment the migration runs. Enabled at `warn` severity in `configs.recommended`.
