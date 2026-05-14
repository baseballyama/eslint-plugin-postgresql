---
"eslint-plugin-postgresql": minor
---

Add `postgresql/require-named-constraint` rule: warns when a table-level `CHECK`, `UNIQUE`, `FOREIGN KEY`, or `EXCLUSION` constraint is declared without an explicit `CONSTRAINT <name>`. Auto-generated constraint names vary across environments and make later `DROP CONSTRAINT` / `ALTER CONSTRAINT` statements brittle. Enabled at `warn` severity in `configs.recommended`.
