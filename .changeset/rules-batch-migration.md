---
"eslint-plugin-postgresql": minor
---

Three migration-safety rules added to `configs.recommended` at
`error`:

- `no-add-check-constraint-without-not-valid` — companion to
  `prefer-fk-not-valid`; CHECK constraints added without `NOT VALID`
  hold `ACCESS EXCLUSIVE` for the entire validating scan.
- `no-add-unique-constraint-directly` — inline
  `ALTER TABLE ... ADD CONSTRAINT ... UNIQUE (cols)` builds the
  underlying index synchronously under `ACCESS EXCLUSIVE`. Build the
  index out-of-band with `CREATE UNIQUE INDEX CONCURRENTLY` and then
  promote it via `ADD CONSTRAINT ... UNIQUE USING INDEX <name>`.
- `no-volatile-default-on-add-column` — `ADD COLUMN ... DEFAULT
random()` (or any other VOLATILE function) forces a full table
  rewrite under `ACCESS EXCLUSIVE` because the PG10+ stable-default
  short-cut cannot apply. Recognized volatile generators include
  `random`, `gen_random_uuid`, `uuid_generate_v1*`, `uuid_generate_v4`,
  `clock_timestamp`, `timeofday`. `now()` / `current_timestamp` /
  `current_date` are STABLE within a statement and not flagged.
