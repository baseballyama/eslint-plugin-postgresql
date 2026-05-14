---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-drop-not-null` rule: warns on `ALTER TABLE ... ALTER COLUMN ... DROP NOT NULL` because relaxing the constraint silently breaks every consumer that already assumes the column is non-null. Enabled at `warn` severity in `configs.recommended`.
