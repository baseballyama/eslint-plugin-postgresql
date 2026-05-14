---
"eslint-plugin-postgresql": minor
---

`postgresql/align-column-definitions`:

- New `gap` option (integer, default `2`) controls the minimum number of
  spaces inserted between the name / type / constraints lanes.
- Tables that mix column definitions with table-level constraints
  (`PRIMARY KEY (a, b)`, `CHECK (...)`, etc.) are now realigned. The
  table-level constraint rows are preserved as-is; only the ColumnDef
  rows are touched.
