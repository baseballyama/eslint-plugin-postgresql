---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-add-column-not-null-without-default` rule: errors when `ALTER TABLE ... ADD COLUMN ... NOT NULL` is missing a `DEFAULT`, which causes the migration to fail on any non-empty table. Enabled at `error` severity in `configs.recommended`.
