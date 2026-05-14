---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-vacuum-full` rule: warns on `VACUUM FULL` because it takes `ACCESS EXCLUSIVE` and rewrites the whole table, making it unavailable for the duration. Plain `VACUUM` is fine. Enabled at `warn` severity in `configs.recommended`.
