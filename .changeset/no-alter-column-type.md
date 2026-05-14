---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-alter-column-type` rule: warns on `ALTER TABLE ... ALTER COLUMN ... TYPE ...`, which may rewrite the entire table under an `ACCESS EXCLUSIVE` lock. Enabled at `warn` severity in `configs.recommended`.
