---
"eslint-plugin-postgresql": minor
---

Add `no-identifier-too-long` rule that flags identifiers longer than PostgreSQL's `NAMEDATALEN - 1` limit (63 bytes by default). PostgreSQL silently truncates over-length identifiers at parse time, so the created object's name no longer matches what was written and later `DROP CONSTRAINT` / `ALTER ... RENAME` / `\d` lookups fail with `does not exist`. The rule checks table, column, constraint, index, schema, sequence, function/procedure, view, trigger, type, domain, and policy names, plus the target of any `ALTER ... RENAME ... TO`. Length is measured in UTF-8 bytes, not characters, so multi-byte (e.g. CJK) names are correctly evaluated. The byte limit is configurable via the `max` option for builds that compile PostgreSQL with a larger `NAMEDATALEN`. Enabled at `error` in `configs.recommended`.
