---
"eslint-plugin-postgresql": minor
---

Update `postgresql-eslint-parser` to 0.6.0. Reports now land on the statement
or token they describe. Some existing reports move, so this is a minor
release:

- `no-syntax-error` shows PostgreSQL's own message for lexer errors, such as an
  unterminated string, instead of a JSON parse error.
- A rule that reports on the second or a later statement in a file now
  reports at that statement's start, not at the end of the previous statement.
  This affects `consistent-create-index-concurrently` and `no-grant-all`, for
  example.
- When a statement is preceded by a comment, rules such as
  `require-table-columns` report on the `CREATE` line, not the comment line.
- `eslint-disable-next-line` placed above a statement now applies to it.
- In the `embedded-sql` processor, statement-level reports on Prisma's
  `$executeRaw` / `$queryRaw` (for example `require-where-in-delete`) point at
  the start of the SQL statement. Reports on a node inside the statement do not
  move.
- Rules that read tokens, such as `no-identifier-too-long` and
  `consistent-as-for-column-alias`, can report new problems. Like PostgreSQL,
  the parser now keeps these as single tokens: non-ASCII identifiers (`名前`),
  identifiers with `$`, prefixed strings (`E'…'`), and operators such as `->>`.
  Review new reports after upgrading.

The parser now also loads with `@libpg-query/parser` 17.8.0, and needs 17.6.6 or
later.
