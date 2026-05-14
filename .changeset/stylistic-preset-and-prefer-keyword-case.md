---
"eslint-plugin-postgresql": minor
---

Add `configs.stylistic` preset and the first rule in it,
`postgresql/prefer-keyword-case`. The new preset is opt-in and groups
auto-fixable layout / casing rules; PostgreSQL formatters do not cover
PL/pgSQL well, so this plugin will host a stylistic layer of its own.

`prefer-keyword-case` enforces consistent casing for SQL keywords. The
default is `upper`; pass `["error", { case: "lower" }]` to flip it. Auto-
fixable.
