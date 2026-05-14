---
"eslint-plugin-postgresql": patch
---

Fix `align-column-definitions` preserving runs of whitespace inside a column's constraint span. Previously, an input like `id bigint GENERATED ALWAYS AS IDENTITY                     PRIMARY KEY` would be auto-fixed without normalizing the gap between `IDENTITY` and `PRIMARY KEY`, so the misalignment in the source bled into the output. The fix collapses internal whitespace to a single space before re-emitting.
