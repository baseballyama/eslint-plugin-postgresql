---
"eslint-plugin-postgresql": minor
---

Add `postgresql/prefer-bigint-id` rule: warns when a primary-key `id` column is declared as `int`, `smallint`, `serial`, or `smallserial`. Widening an integer primary key later requires a full table rewrite under `ACCESS EXCLUSIVE`; declaring `bigint` from the start avoids that future incident. UUID primary keys and non-PK `id` columns are unaffected. Enabled at `warn` severity in `configs.recommended`.
