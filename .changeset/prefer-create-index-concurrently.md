---
"eslint-plugin-postgresql": minor
---

Add `postgresql/prefer-create-index-concurrently` rule: warns on plain `CREATE INDEX` and recommends `CREATE INDEX CONCURRENTLY`. Off by default because the right answer depends on the migration framework.
