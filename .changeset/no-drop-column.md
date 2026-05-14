---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-drop-column` rule: warns on `ALTER TABLE ... DROP COLUMN`, which breaks every running app instance that still references the column. Enabled at `warn` severity in `configs.recommended`.
