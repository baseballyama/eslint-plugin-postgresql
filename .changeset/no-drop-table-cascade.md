---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-drop-table-cascade` rule: warns on `DROP ... CASCADE` (table, schema, type, etc.) because CASCADE silently removes dependent objects. Enabled at `warn` severity in `configs.recommended`.
