---
"eslint-plugin-postgresql": patch
---

`require-trailing-semicolon` no longer checks embedded SQL (the templates the `embedded-sql` processor lints), so its fix no longer puts a `;` in one. Query builders splice templates into each other, so a `;` added to ``sql`SELECT id FROM users` `` ended any query that used it as a subquery. The `**/*.ts/*.sql` override the README used to suggest for this rule is no longer needed, and an `eslint-disable` comment for it inside a template is now reported as unused.
