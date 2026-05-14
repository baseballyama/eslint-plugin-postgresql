---
"eslint-plugin-postgresql": patch
---

`align-column-definitions` now realigns column rows that carry a
trailing `--` or `/* */` comment after the constraints (e.g.
`id ulid PRIMARY KEY, -- the surrogate key`). Previously the rule
bailed on the whole table when any line had a comment, even when the
comment was safely outside the rewrite range. Inline comments
_inside_ a column's name/type/constraints span are still skipped
(rewriting them would clobber the comment text).
