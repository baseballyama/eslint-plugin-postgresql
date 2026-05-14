---
"eslint-plugin-postgresql": minor
---

Add three AST-aware stylistic rules to `configs.stylistic`, all auto-
fixable:

- `prefer-as-for-table-alias` — require `AS` before table aliases
  (`FROM users AS u`, not `FROM users u`).
- `prefer-as-for-column-alias` — require `AS` before column aliases in
  `SELECT` lists. Restricted to `SelectStmt.targetList` so INSERT column
  lists and UPDATE SET clauses are not affected.
- `require-trailing-semicolon` — require the file to end with a `;`.
