---
"eslint-plugin-postgresql": minor
---

Add `postgresql/plpgsql-keyword-case` (in `configs.stylistic`,
auto-fixable).

The existing `prefer-keyword-case` rule walks SQL tokens, which now stops
at the `$$...$$` boundary (the body is a single String token). This new
rule covers what's inside PL/pgSQL function bodies — both the embedded
SQL and the PL-specific keywords like `BEGIN`, `EXCEPTION`, `RAISE`.

Operates only on `EmbeddedCode` nodes whose `language` is `plpgsql`.
String literals (`'...'`) and comments (`--`, `/* */`) inside the body
are skipped so identifiers that happen to spell a keyword are left alone
when they appear in those contexts.

Keyword set is the union of PostgreSQL 17's `kwlist.h` and the PL/pgSQL
`pl_reserved_kwlist.h` / `pl_unreserved_kwlist.h` — 540 keywords total.
Re-run `pnpm generate-pg-keywords` when bumping libpg-query across PG
major versions.
