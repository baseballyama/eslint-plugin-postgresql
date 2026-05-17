---
"eslint-plugin-postgresql": minor
---

Add `no-composite-primary-key` rule that disallows composite (multi-column) PRIMARY KEY constraints, both as table-level constraints in `CREATE TABLE` and via `ALTER TABLE ... ADD CONSTRAINT ... PRIMARY KEY (...)`. Composite primary keys force every foreign-key reference to repeat the full column set, complicate ORM mapping, and make the natural key painful to change later. Use a single surrogate key (e.g. `id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY`) and enforce the natural uniqueness with a `UNIQUE` constraint instead. Off by default — composite keys are a valid design choice and the rule encodes a strong opinion projects must opt into.
