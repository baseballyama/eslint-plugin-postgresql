---
"eslint-plugin-postgresql": minor
---

Three issues fixed plus a parser dep bump:

- **#136 fix:** `require-trailing-semicolon` no longer appends a run of
  bare `;` characters at EOF when the file contains a parser-level
  syntax error. The rule now skips `SQLParseError` body entries; their
  range covers the whole file (or its tail) and inserting `;` cannot
  turn malformed SQL into valid SQL.
- **#137 fix:** `align-column-definitions` now treats parameterized
  types like `TIMESTAMP(3)`, `VARCHAR(255)`, `NUMERIC(10, 2)` as a
  single alignment column. Previously the bare type name and its
  `(...)` modifier landed in different lanes, splitting `TIMESTAMP(3)`
  into `TIMESTAMP  (3)` and dragging the type column's width down.
- **#132 feat:** `snake-case-column-name` and `snake-case-table-name`
  gain a shared `allow` option (`string[]`, default `[]`). Listed
  identifiers are exempted from the snake_case check by exact-match.
  Default behavior is unchanged.
- Bumps `postgresql-eslint-parser` to `^0.5.0`, which fixes inner-node
  range aggregation for descendants without observed locations.
