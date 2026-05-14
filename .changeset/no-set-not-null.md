---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-set-not-null` rule: warns on `ALTER TABLE ... ALTER COLUMN ... SET NOT NULL` because the operation requires a full table scan under `ACCESS EXCLUSIVE`. Use the `ADD CHECK ... NOT VALID` + `VALIDATE CONSTRAINT` + `SET NOT NULL` pattern instead. Enabled at `warn` severity in `configs.recommended`.
