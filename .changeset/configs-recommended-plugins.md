---
"eslint-plugin-postgresql": minor
---

`configs.recommended` now includes a `plugins: { postgresql }` field. Spreading `...postgresql.configs.recommended` in a flat ESLint config now binds the plugin automatically, so consumers no longer have to add `plugins: { postgresql }` separately for the rule severities to resolve. The README example continues to work as written.
