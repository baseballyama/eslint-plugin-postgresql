---
"eslint-plugin-postgresql": minor
---

Add 3 new rules and extend `prefer-current-timestamp-over-now`:

- `no-grant-all`: forbids `GRANT ALL` (catch-all privilege grants are too coarse — list privileges explicitly).
- `prefer-exists-over-in-subquery`: prefer `EXISTS (subquery)` over `column IN (subquery)`. `IN` semantics with NULL on the right side surprise users; `EXISTS` is also typically cheaper.
- `require-index-on-fk-column`: every foreign-key column must be backed by a leading-column index in the same file. Cross-statement (looks across `CREATE TABLE`, `CREATE INDEX`, `ALTER TABLE ADD CONSTRAINT`).
- `prefer-current-timestamp-over-now`: now also flags bareword `LOCALTIMESTAMP` / `LOCALTIME` and autofixes them to `CURRENT_TIMESTAMP` / `CURRENT_TIME`. New message IDs `preferCurrentTimestampOverLocal` / `preferCurrentTimeOverLocal`.

The three new rules are in `configs.recommended` at `warn`.
