---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-rename-table` rule: warns on `ALTER TABLE ... RENAME TO`, which breaks every running app that still queries the old name. Enabled at `warn` severity in `configs.recommended`.
