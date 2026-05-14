---
"eslint-plugin-postgresql": minor
---

Add `postgresql/prefer-reindex-concurrently` rule: warns on `REINDEX` without `CONCURRENTLY`, which locks the table (or index) for the duration of the rebuild. PG ≥ 12 supports concurrent reindexing. Enabled at `warn` severity in `configs.recommended`.
