---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-select-star` rule: warns on `SELECT *` and `<alias>.*` so result schemas stay stable when the underlying table changes. Off by default; opt in by setting it in your ESLint config.
