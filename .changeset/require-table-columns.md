---
"eslint-plugin-postgresql": minor
---

Add `require-table-columns` rule that requires every `CREATE TABLE` to declare a configured set of columns. Useful for enforcing project-wide schema conventions — e.g. every table must carry the tenant key plus the audit columns `created_at`, `created_by`, `updated_at`, `updated_by`. Three options: `columns` (the default required column names, mandatory), `overrides` (an array of `{ pattern, columns }` entries — the first regex match replaces the column list entirely, so an append-only `^.+_temporal$` table can require a smaller set), and `exclude` (a regex for tables to skip completely, e.g. audit / log tables). Off by default because the column list is project-specific and has no sensible default.
