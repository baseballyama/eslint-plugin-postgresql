---
"eslint-plugin-postgresql": patch
---

`no-cross-join` no longer flags `CROSS JOIN LATERAL`. The right side of a
LATERAL join is correlated with the row on its left, so it cannot produce the
unintended cartesian product the rule exists to catch — and there is no
`ON` clause to write instead. A plain `CROSS JOIN` still reports.
