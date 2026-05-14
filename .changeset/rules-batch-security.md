---
"eslint-plugin-postgresql": minor
---

Three security/correctness rules added to `configs.recommended` at
`error`:

- `no-security-definer-without-search-path` — `SECURITY DEFINER`
  functions that omit `SET search_path = ...` are a well-known
  privilege-escalation vector. An attacker who can create a schema
  in the caller's `search_path` can shadow built-in objects called
  from inside the function body and get arbitrary code execution as
  the function owner. Pin `search_path` (e.g. to `pg_catalog,
pg_temp`) on every `SECURITY DEFINER` definition.
- `no-equality-with-null` — `x = NULL` / `x <> NULL` always evaluate
  to NULL (treated as false), silently filtering away rows the author
  intended to keep. The fix is `IS NULL` / `IS NOT NULL`.
- `no-update-without-from-binding` — `UPDATE t SET ... FROM other`
  without a `WHERE` clause produces a Cartesian product with the
  target and updates every row of `t` once per row of `other`. Add a
  join condition in `WHERE`.
