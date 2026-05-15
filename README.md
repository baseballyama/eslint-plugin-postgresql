# eslint-plugin-postgresql

[![npm version](https://img.shields.io/npm/v/eslint-plugin-postgresql.svg)](https://www.npmjs.com/package/eslint-plugin-postgresql)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An ESLint plugin for PostgreSQL `.sql` files. It catches syntax errors and
enforces PostgreSQL-specific best practices, powered by
[`postgresql-eslint-parser`](https://github.com/baseballyama/postgresql-eslint-parser)
and [`libpg-query`](https://github.com/pganalyze/libpg-query-node).

📚 **Documentation & Playground**: <https://baseballyama.github.io/eslint-plugin-postgresql/>

## Installation

```bash
npm install --save-dev eslint-plugin-postgresql
```

```bash
pnpm add -D eslint-plugin-postgresql
```

## Usage

Add the plugin to your ESLint flat config (`eslint.config.js`):

```js
import postgresql from "eslint-plugin-postgresql";

export default [
  {
    files: ["**/*.sql"],
    ...postgresql.configs.recommended,
  },
];
```

To override individual rule severities, add another config block after the
recommended preset:

```js
import postgresql from "eslint-plugin-postgresql";

export default [
  {
    files: ["**/*.sql"],
    ...postgresql.configs.recommended,
  },
  {
    files: ["migrations/**/*.sql"],
    rules: {
      "postgresql/require-limit": "off",
    },
  },
];
```

### Stylistic preset (optional)

Layout / casing / formatting rules live in a separate `configs.stylistic`
preset. PostgreSQL formatters (`prettier-plugin-sql`, `pg_format`) do not
cover PL/pgSQL well, so this plugin ships an opt-in stylistic layer. Every
rule in `configs.stylistic` is auto-fixable.

```js
import postgresql from "eslint-plugin-postgresql";

export default [
  {
    files: ["**/*.sql"],
    ...postgresql.configs.recommended,
  },
  {
    files: ["**/*.sql"],
    ...postgresql.configs.stylistic,
  },
];
```

### All preset (everything-on)

`configs.all` enables every rule the plugin ships at `error`. It is
deliberately noisy — useful for exploring what the plugin can catch, or
for greenfield projects that want to audit and then disable rules they
don't want. Not recommended for an existing codebase without overrides.

```js
import postgresql from "eslint-plugin-postgresql";

export default [
  {
    files: ["**/*.sql"],
    ...postgresql.configs.all,
  },
];
```

## Rules

Click a rule name to open its documentation page (examples, rationale, options).

**Legend**

- ✅ — enabled as `error` in `configs.recommended`
- ⚠️ — enabled as `warn` in `configs.recommended`
- 🎨 — enabled in `configs.stylistic` (auto-fixable)
- (blank) — off by default; opt in per project

| Rule                                                                                                                                             | Description                                                                | Recommended |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | :---------: |
| [align-column-definitions](https://baseballyama.github.io/eslint-plugin-postgresql/rules/align-column-definitions)                               | Align column definitions vertically inside `CREATE TABLE`                  |     🎨      |
| [align-values](https://baseballyama.github.io/eslint-plugin-postgresql/rules/align-values)                                                       | Align column values vertically inside multi-row `INSERT ... VALUES`        |     🎨      |
| [consistent-as-for-column-alias](https://baseballyama.github.io/eslint-plugin-postgresql/rules/consistent-as-for-column-alias)                   | Enforce a consistent stance on `AS` before column aliases in `SELECT`      |     🎨      |
| [consistent-as-for-table-alias](https://baseballyama.github.io/eslint-plugin-postgresql/rules/consistent-as-for-table-alias)                     | Enforce a consistent stance on `AS` before table aliases                   |     🎨      |
| [consistent-between-over-and](https://baseballyama.github.io/eslint-plugin-postgresql/rules/consistent-between-over-and)                         | Enforce a consistent stance on `BETWEEN` vs `>= ... AND <=`                |     🎨      |
| [consistent-create-index-concurrently](https://baseballyama.github.io/eslint-plugin-postgresql/rules/consistent-create-index-concurrently)       | Enforce a consistent stance on `CONCURRENTLY` for `CREATE INDEX`           |             |
| [consistent-create-or-replace](https://baseballyama.github.io/eslint-plugin-postgresql/rules/consistent-create-or-replace)                       | Enforce a consistent stance on `CREATE OR REPLACE` for FUNCTION/PROC/VIEW  |             |
| [consistent-drop-index-concurrently](https://baseballyama.github.io/eslint-plugin-postgresql/rules/consistent-drop-index-concurrently)           | Enforce a consistent stance on `CONCURRENTLY` for `DROP INDEX`             |             |
| [consistent-explicit-inner-join](https://baseballyama.github.io/eslint-plugin-postgresql/rules/consistent-explicit-inner-join)                   | Enforce a consistent stance on explicit `INNER` in `INNER JOIN`            |     🎨      |
| [consistent-explicit-outer-join](https://baseballyama.github.io/eslint-plugin-postgresql/rules/consistent-explicit-outer-join)                   | Enforce a consistent stance on explicit `OUTER` in `LEFT/RIGHT/FULL JOIN`  |     🎨      |
| [consistent-fk-not-valid](https://baseballyama.github.io/eslint-plugin-postgresql/rules/consistent-fk-not-valid)                                 | Enforce a consistent stance on `NOT VALID` for FK constraints              |     ⚠️      |
| [consistent-identity-over-serial](https://baseballyama.github.io/eslint-plugin-postgresql/rules/consistent-identity-over-serial)                 | Enforce a consistent stance on identity vs serial columns                  |     ⚠️      |
| [consistent-jsonb-over-json](https://baseballyama.github.io/eslint-plugin-postgresql/rules/consistent-jsonb-over-json)                           | Enforce a consistent stance on `jsonb` vs `json`                           |     ⚠️      |
| [consistent-reindex-concurrently](https://baseballyama.github.io/eslint-plugin-postgresql/rules/consistent-reindex-concurrently)                 | Enforce a consistent stance on `CONCURRENTLY` for `REINDEX`                |     ⚠️      |
| [consistent-text-over-varchar](https://baseballyama.github.io/eslint-plugin-postgresql/rules/consistent-text-over-varchar)                       | Enforce a consistent stance on `text` vs `varchar(n)`                      |     ⚠️      |
| [consistent-timestamptz](https://baseballyama.github.io/eslint-plugin-postgresql/rules/consistent-timestamptz)                                   | Enforce a consistent stance on `timestamptz` vs `timestamp`                |     ⚠️      |
| [no-add-column-not-null-without-default](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-add-column-not-null-without-default)   | Disallow `ADD COLUMN ... NOT NULL` without a `DEFAULT`                     |     ✅      |
| [no-alter-column-type](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-alter-column-type)                                       | Disallow `ALTER COLUMN ... TYPE` (table rewrite under exclusive lock)      |     ⚠️      |
| [no-char-type](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-char-type)                                                       | Disallow `char(n)` / `bpchar(n)` columns                                   |     ⚠️      |
| [no-cluster](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-cluster)                                                           | Disallow `CLUSTER` (rewrites the table under exclusive lock)               |     ⚠️      |
| [no-create-role](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-create-role)                                                   | Disallow `CREATE ROLE` / `CREATE USER` in versioned SQL                    |     ⚠️      |
| [no-cross-join](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-cross-join)                                                     | Disallow `CROSS JOIN`                                                      |     ⚠️      |
| [no-distinct-on-without-order-by](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-distinct-on-without-order-by)                 | Require `ORDER BY` when using `SELECT DISTINCT ON (...)`                   |     ✅      |
| [no-drop-column](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-drop-column)                                                   | Disallow `ALTER TABLE ... DROP COLUMN` (breaks live readers)               |     ⚠️      |
| [no-drop-database](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-drop-database)                                               | Disallow `DROP DATABASE`                                                   |     ✅      |
| [no-drop-not-null](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-drop-not-null)                                               | Disallow `ALTER COLUMN ... DROP NOT NULL`                                  |     ⚠️      |
| [no-drop-schema-cascade](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-drop-schema-cascade)                                   | Disallow `DROP SCHEMA ... CASCADE`                                         |     ⚠️      |
| [no-drop-table-cascade](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-drop-table-cascade)                                     | Disallow `DROP TABLE ... CASCADE`                                          |     ⚠️      |
| [no-equality-with-null](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-equality-with-null)                                     | Disallow `x = NULL` / `x <> NULL`; use `IS NULL` / `IS NOT NULL`           |     ✅      |
| [no-grant-all](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-grant-all)                                                       | Disallow `GRANT ALL` (list privileges explicitly)                          |     ⚠️      |
| [no-grant-to-public](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-grant-to-public)                                           | Disallow `GRANT ... TO PUBLIC`                                             |     ⚠️      |
| [no-group-by-ordinal](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-group-by-ordinal)                                         | Disallow positional `GROUP BY` references (`GROUP BY 1`)                   |     ⚠️      |
| [no-having-without-group-by](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-having-without-group-by)                           | Disallow `HAVING` without `GROUP BY`                                       |     ✅      |
| [no-identifier-too-long](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-identifier-too-long)                                   | Disallow identifiers longer than PostgreSQL's `NAMEDATALEN - 1` (63 bytes) |     ✅      |
| [no-implicit-join](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-implicit-join)                                               | Disallow comma-style implicit joins (`FROM a, b WHERE ...`)                |     ⚠️      |
| [no-leading-wildcard-like](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-leading-wildcard-like)                               | Disallow `LIKE` / `ILIKE` patterns that start with `%`                     |     ⚠️      |
| [no-money-type](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-money-type)                                                     | Disallow the `money` column type                                           |     ✅      |
| [no-natural-join](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-natural-join)                                                 | Disallow `NATURAL JOIN`                                                    |     ✅      |
| [no-not-in-subquery](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-not-in-subquery)                                           | Disallow `NOT IN (subquery)` (NULL produces no rows)                       |     ✅      |
| [no-numeric-without-precision](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-numeric-without-precision)                       | Disallow bare `numeric` / `decimal` without precision and scale            |     ⚠️      |
| [no-on-delete-cascade](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-on-delete-cascade)                                       | Disallow `ON DELETE CASCADE` on foreign keys                               |     ⚠️      |
| [no-order-by-ordinal](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-order-by-ordinal)                                         | Disallow positional `ORDER BY` references (`ORDER BY 1`)                   |     ⚠️      |
| [no-rename-column](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-rename-column)                                               | Disallow `ALTER TABLE ... RENAME COLUMN` (breaks live readers)             |     ⚠️      |
| [no-rename-table](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-rename-table)                                                 | Disallow `ALTER TABLE ... RENAME TO`                                       |     ⚠️      |
| [no-rule](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-rule)                                                                 | Disallow `CREATE RULE`; effectively deprecated in favor of triggers/views  |     ⚠️      |
| [no-security-definer-without-search-path](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-security-definer-without-search-path) | Disallow `SECURITY DEFINER` without `SET search_path` (CVE risk)           |     ✅      |
| [no-select-into](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-select-into)                                                   | Disallow `SELECT ... INTO target` (use `CREATE TABLE AS`)                  |     ⚠️      |
| [no-select-star](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-select-star)                                                   | Disallow `SELECT *` and `<alias>.*`                                        |             |
| [no-set-not-null](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-set-not-null)                                                 | Disallow `ALTER COLUMN ... SET NOT NULL` (full-table scan)                 |     ⚠️      |
| [no-set-search-path](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-set-search-path)                                           | Disallow `SET search_path = ...` in versioned SQL                          |     ⚠️      |
| [no-syntax-error](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-syntax-error)                                                 | Detect PostgreSQL syntax errors                                            |     ✅      |
| [no-temporary-table](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-temporary-table)                                           | Disallow `CREATE TEMP TABLE` / `CREATE TEMPORARY TABLE`                    |     ⚠️      |
| [no-time-type](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-time-type)                                                       | Disallow `time` and `timetz` columns                                       |     ⚠️      |
| [no-truncate-cascade](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-truncate-cascade)                                         | Disallow `TRUNCATE ... CASCADE`                                            |     ⚠️      |
| [no-unnecessary-quoted-identifier](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-unnecessary-quoted-identifier)               | Disallow unnecessary `"..."` around identifiers that work bare             |     🎨      |
| [no-unlogged-table](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-unlogged-table)                                             | Disallow `CREATE UNLOGGED TABLE`                                           |     ⚠️      |
| [no-update-primary-key](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-update-primary-key)                                     | Disallow `UPDATE` on primary-key columns (heuristic)                       |     ✅      |
| [no-update-without-from-binding](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-update-without-from-binding)                   | Disallow `UPDATE ... FROM` without a `WHERE` (Cartesian product)           |     ✅      |
| [no-vacuum-full](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-vacuum-full)                                                   | Disallow `VACUUM FULL`                                                     |     ⚠️      |
| [no-with-recursive-without-limit](https://baseballyama.github.io/eslint-plugin-postgresql/rules/no-with-recursive-without-limit)                 | Disallow `WITH RECURSIVE` without an outer `LIMIT`                         |     ✅      |
| [plpgsql-keyword-case](https://baseballyama.github.io/eslint-plugin-postgresql/rules/plpgsql-keyword-case)                                       | Enforce a consistent case for SQL/PL/pgSQL keywords inside PL/pgSQL bodies |     🎨      |
| [prefer-add-constraint-not-valid](https://baseballyama.github.io/eslint-plugin-postgresql/rules/prefer-add-constraint-not-valid)                 | Prefer `ADD CONSTRAINT ... NOT VALID` then `VALIDATE CONSTRAINT`           |     ⚠️      |
| [prefer-bigint-id](https://baseballyama.github.io/eslint-plugin-postgresql/rules/prefer-bigint-id)                                               | Require `bigint` for primary-key `id` columns                              |     ⚠️      |
| [prefer-cast-operator](https://baseballyama.github.io/eslint-plugin-postgresql/rules/prefer-cast-operator)                                       | Enforce a single style for type casts (`x::int` or `CAST(x AS int)`)       |     🎨      |
| [prefer-coalesce-over-case](https://baseballyama.github.io/eslint-plugin-postgresql/rules/prefer-coalesce-over-case)                             | Prefer `COALESCE(x, y)` over a null-fallback `CASE`                        |     ⚠️      |
| [prefer-current-timestamp-over-now](https://baseballyama.github.io/eslint-plugin-postgresql/rules/prefer-current-timestamp-over-now)             | Prefer SQL-standard `CURRENT_TIMESTAMP` over `now()` / `LOCALTIMESTAMP`    |     🎨      |
| [prefer-exists-over-in-subquery](https://baseballyama.github.io/eslint-plugin-postgresql/rules/prefer-exists-over-in-subquery)                   | Prefer `EXISTS (subquery)` over `column IN (subquery)`                     |     ⚠️      |
| [prefer-explicit-null-ordering](https://baseballyama.github.io/eslint-plugin-postgresql/rules/prefer-explicit-null-ordering)                     | Require `NULLS FIRST` / `NULLS LAST` when `ORDER BY` specifies a direction |     ⚠️      |
| [prefer-in-list-over-or](https://baseballyama.github.io/eslint-plugin-postgresql/rules/prefer-in-list-over-or)                                   | Prefer `x IN (a, b, c)` over `x = a OR x = b OR x = c`                     |     🎨      |
| [prefer-keyword-case](https://baseballyama.github.io/eslint-plugin-postgresql/rules/prefer-keyword-case)                                         | Enforce a consistent case (upper or lower) for SQL keywords                |     🎨      |
| [prefer-not-equals-operator](https://baseballyama.github.io/eslint-plugin-postgresql/rules/prefer-not-equals-operator)                           | Enforce a single style for the not-equal operator (`<>` or `!=`)           |     🎨      |
| [require-if-exists](https://baseballyama.github.io/eslint-plugin-postgresql/rules/require-if-exists)                                             | Require `IF EXISTS` on every `DROP` statement                              |             |
| [require-index-on-fk-column](https://baseballyama.github.io/eslint-plugin-postgresql/rules/require-index-on-fk-column)                           | Require an index on every foreign-key column                               |     ⚠️      |
| [require-limit](https://baseballyama.github.io/eslint-plugin-postgresql/rules/require-limit)                                                     | Require `LIMIT` in `SELECT` statements                                     |     ⚠️      |
| [require-named-constraint](https://baseballyama.github.io/eslint-plugin-postgresql/rules/require-named-constraint)                               | Require explicit `CONSTRAINT <name>` for table-level constraints           |     ⚠️      |
| [require-on-delete-action](https://baseballyama.github.io/eslint-plugin-postgresql/rules/require-on-delete-action)                               | Require an explicit `ON DELETE` clause on every foreign-key constraint     |     ⚠️      |
| [require-primary-key](https://baseballyama.github.io/eslint-plugin-postgresql/rules/require-primary-key)                                         | Require a primary key on `CREATE TABLE`                                    |     ⚠️      |
| [require-schema-qualified-table](https://baseballyama.github.io/eslint-plugin-postgresql/rules/require-schema-qualified-table)                   | Require schema-qualified names in `CREATE TABLE`                           |             |
| [require-trailing-semicolon](https://baseballyama.github.io/eslint-plugin-postgresql/rules/require-trailing-semicolon)                           | Require a trailing `;` after every top-level SQL statement                 |     🎨      |
| [require-where-in-delete](https://baseballyama.github.io/eslint-plugin-postgresql/rules/require-where-in-delete)                                 | Require `WHERE` in `DELETE` statements                                     |     ✅      |
| [require-where-in-update](https://baseballyama.github.io/eslint-plugin-postgresql/rules/require-where-in-update)                                 | Require `WHERE` in `UPDATE` statements                                     |     ✅      |
| [snake-case-column-name](https://baseballyama.github.io/eslint-plugin-postgresql/rules/snake-case-column-name)                                   | Require snake_case column names                                            |     ⚠️      |
| [snake-case-table-name](https://baseballyama.github.io/eslint-plugin-postgresql/rules/snake-case-table-name)                                     | Require snake_case table names                                             |     ⚠️      |

## Contributing

Issues and pull requests are welcome — please follow the templates. See
[CLAUDE.md](CLAUDE.md) for the contributor guide and project conventions.

## License

[MIT](LICENSE)

## Related projects

- [postgresql-eslint-parser](https://github.com/baseballyama/postgresql-eslint-parser) — the parser used by this plugin
- [libpg-query](https://github.com/pganalyze/libpg-query-node) — PostgreSQL parser bindings used under the hood
