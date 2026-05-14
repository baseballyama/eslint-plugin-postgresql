---
"eslint-plugin-postgresql": minor
---

Tighten `require-trailing-semicolon` to check every top-level statement
individually, not just the file's last token.

Bumps `postgresql-eslint-parser` to `^0.4.0`, which carries the
`stmt_location` / `stmt_len` fix that makes per-statement ranges
trustworthy.
