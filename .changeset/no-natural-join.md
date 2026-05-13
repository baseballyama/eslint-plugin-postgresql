---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-natural-join` rule: errors on `NATURAL JOIN` because the join columns are implicit and silently change when columns are added. Enabled at `error` severity in `configs.recommended`.
