---
"eslint-plugin-postgresql": minor
---

The embedded-SQL processor now lints fragments, such as ``sql`AND age > ${x}` `` or
``sql`${users.id} IS NULL` ``, instead of skipping every template that is not a
complete statement. A fragment is parsed inside the first of `SELECT …`,
`SELECT 1 …` and `SELECT * FROM _ …` that accepts it, and nothing is reported
on that added context.
