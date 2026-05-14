---
"eslint-plugin-postgresql": minor
---

Add `postgresql/prefer-fk-not-valid` rule: warns on `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY (...)` that does not include `NOT VALID`. Validating an FK takes an `ACCESS EXCLUSIVE` lock for the full scan; `NOT VALID` + a separate `VALIDATE CONSTRAINT` only needs `SHARE UPDATE EXCLUSIVE`. Enabled at `warn` severity in `configs.recommended`.
