---
"eslint-plugin-postgresql": minor
---

`postgresql/require-if-exists`: remove the autofix.

Adding `IF EXISTS` to a `DROP` statement is a runtime-semantics change: without it, dropping a missing object raises `does not exist` and aborts the migration; with it, the same statement silently no-ops. The choice between "idempotent re-run" and "fail fast on schema drift" belongs to the author, not the linter.

The rule still reports the violation so authors can pick the right form by hand. The `fixable` metadata is removed, the message is unchanged.
