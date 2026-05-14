---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-drop-schema-cascade` rule: warns on `DROP SCHEMA ... CASCADE`, which silently removes every object in the schema. The companion to `no-drop-table-cascade` with a much larger blast radius. Enabled at `warn` severity in `configs.recommended`.
