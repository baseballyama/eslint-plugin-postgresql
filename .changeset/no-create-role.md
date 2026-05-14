---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-create-role` rule: warns on `CREATE ROLE` / `CREATE USER` in versioned SQL. Roles and credentials belong in an operator-managed bootstrap workflow, not in application migrations. Granting privileges to existing roles remains fine. Enabled at `warn` severity in `configs.recommended`.
