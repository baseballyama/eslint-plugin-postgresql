---
"eslint-plugin-postgresql": minor
---

Add `postgresql/require-schema-qualified-table` rule: warns on `CREATE TABLE foo (...)` without a schema-qualified name. Off by default in `configs.recommended` because many projects keep everything in `public`; enable explicitly when you organize by schema.
