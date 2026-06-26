---
"eslint-plugin-postgresql": patch
---

fix(no-set-search-path): do not flag the `search_path` pin on function definitions

A `SET search_path = ...` clause attached to a `CREATE FUNCTION` / `CREATE PROCEDURE` / `ALTER FUNCTION` is the documented mitigation for `search_path` injection and is _required_ by `no-security-definer-without-search-path`. Flagging it made the two `recommended` rules mutually unsatisfiable for `SECURITY DEFINER` functions (no value of `search_path`, not even `''`, could satisfy both). The rule now reports only standalone `SET search_path` statements.
