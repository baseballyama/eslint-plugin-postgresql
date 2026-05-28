---
"eslint-plugin-postgresql": minor
---

`postgresql/consistent-create-or-replace`: remove the autofix.

Adding `OR REPLACE` turns a CREATE statement from "abort if the object already exists" into "silently overwrite the existing object"; removing it does the reverse. Both are runtime-semantics changes that depend on author intent — the maintenance migration that re-defines a function intentionally needs `OR REPLACE`, while the initial-creation migration intentionally does not. An ESLint autofixer must not make that choice on the author's behalf.

The rule still reports the violation so authors can pick the right form by hand. The `fixable` metadata is removed, and the messages are unchanged.
