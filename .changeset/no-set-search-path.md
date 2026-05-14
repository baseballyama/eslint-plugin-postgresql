---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-set-search-path` rule: warns on `SET search_path = ...` in versioned SQL because name resolution that depends on session state is a known footgun for SECURITY DEFINER functions and CREATE statements. Qualify identifiers with their schema instead. Enabled at `warn` severity in `configs.recommended`.
