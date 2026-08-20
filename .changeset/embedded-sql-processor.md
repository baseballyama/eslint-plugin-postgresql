---
"eslint-plugin-postgresql": minor
---

Add the `embedded-sql` processor, which lints SQL written inside `sql` template
literals in TypeScript and JavaScript files — the form Drizzle, postgres.js and
slonik produce. Point it at your source files and the existing rules report
against the original file, autofix included:

```js
{
  files: ["src/**/*.ts"],
  processor: postgresql.processors["embedded-sql"],
}
```

Only complete statements are linted; expression fragments such as
``sql`excluded.user_name` `` are left alone, and `${...}` interpolations are
never reported on or rewritten.
