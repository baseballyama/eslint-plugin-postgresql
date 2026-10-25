---
"eslint-plugin-postgresql": minor
---

Add `createEmbeddedSqlProcessor(isSqlTag)`, which builds the `embedded-sql`
processor for SQL tags other than `sql`, `$queryRaw` and `$executeRaw`.
`isSqlTag` receives the tag's member path without call or type arguments, so
``db.query`...` `` gives `db.query` and slonik's ``sql.type(schema)`...` ``
gives `sql.type`.
