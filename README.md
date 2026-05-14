# eslint-plugin-postgresql

An ESLint plugin for PostgreSQL that provides syntax checking and enforces best practices for SQL files.

## Installation

```bash
npm install --save-dev eslint-plugin-postgresql libpg-query
```

or

```bash
pnpm add -D eslint-plugin-postgresql
```

## Usage

### Basic Configuration

Add the plugin to your ESLint configuration file (`eslint.config.js`):

```javascript
import postgresql from "eslint-plugin-postgresql";

export default [
  {
    files: ["**/*.sql"],
    ...postgresql.configs.recommended,
  },
];
```

### Custom Configuration

For individual rule configuration:

```javascript
import postgresql from "eslint-plugin-postgresql";

export default [
  {
    files: ["**/*.sql"],
    languageOptions: {
      parser: postgresql.configs.recommended.languageOptions.parser,
    },
    plugins: {
      postgresql,
    },
    rules: {
      "postgresql/no-syntax-error": "error",
      "postgresql/require-limit": "warn",
    },
  },
];
```

## Rules

### `postgresql/no-syntax-error`

Detects PostgreSQL syntax errors.

**Type**: Problem  
**Recommended**: ✅ Yes  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
-- Invalid keyword
INVALID_KEYWORD * FROM users;

-- Syntax error
SELECT * FROM WHERE id = 1;
```

✅ Correct:

```sql
-- Valid SQL
SELECT * FROM users WHERE id = 1;
```

### `postgresql/no-select-star`

Disallows `SELECT *` (and `<alias>.*`). Listing columns explicitly keeps result schemas stable when the underlying table evolves and avoids accidentally pulling new sensitive columns into a query.

**Type**: Suggestion  
**Recommended**: ❌ Off by default  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
SELECT * FROM users;
SELECT u.* FROM users u;
```

✅ Correct:

```sql
SELECT id, name FROM users;
SELECT count(*) FROM users; -- aggregate star is fine
```

### `postgresql/require-where-in-delete`

Errors on `DELETE` statements that have no `WHERE` clause — deleting every row in a table is almost always a mistake. Use `TRUNCATE` if you really mean to empty the table.

**Type**: Problem  
**Recommended**: ✅ Error  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
DELETE FROM users;
```

✅ Correct:

```sql
DELETE FROM users WHERE id = 1;
DELETE FROM sessions WHERE expires_at < now();
```

### `postgresql/require-where-in-update`

Errors on `UPDATE` statements without a `WHERE` clause — updating every row in a table is almost always a mistake.

**Type**: Problem  
**Recommended**: ✅ Error  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
UPDATE users SET active = false;
```

✅ Correct:

```sql
UPDATE users SET active = false WHERE id = 1;
```

### `postgresql/no-drop-table-cascade`

Warns on `DROP TABLE ... CASCADE`. `CASCADE` silently removes dependent objects (views, foreign keys, sequences) and is one of the most common ways migrations destroy more than intended. The fix is to list the dependents explicitly. The rule scopes to `DROP TABLE` to match its name; other `DROP ... CASCADE` variants (schema, type, etc.) are not covered.

**Type**: Problem  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
DROP TABLE users CASCADE;
```

✅ Correct:

```sql
DROP TABLE users;
DROP TABLE users RESTRICT;
```

### `postgresql/no-truncate-cascade`

Warns on `TRUNCATE ... CASCADE`. CASCADE on TRUNCATE transitively empties every table that has a foreign key referencing the target, which is essentially never the right tool for the intended operation.

**Type**: Problem  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
TRUNCATE users CASCADE;
```

✅ Correct:

```sql
TRUNCATE users;
TRUNCATE users RESTRICT;
```

### `postgresql/no-cross-join`

Warns on `CROSS JOIN` (cartesian product without a join condition). Almost always a mistake — if the intent really is a cartesian product, write `JOIN ... ON true` so the intent is visible. Note that `INNER JOIN b` without `ON`/`USING` is a parser error in PostgreSQL, so the only shape this rule actually fires on in practice is the explicit `CROSS JOIN`.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
SELECT * FROM a CROSS JOIN b;
```

✅ Correct:

```sql
SELECT * FROM a JOIN b ON a.id = b.id;
SELECT * FROM a INNER JOIN b USING (id);
SELECT * FROM a JOIN b ON true; -- intentional cartesian
```

### `postgresql/no-natural-join`

Errors on `NATURAL JOIN`. The join columns are implicit — any new column added to either side later with a matching name silently changes the join. Use `JOIN ... USING (...)` or `JOIN ... ON ...` to name the columns.

**Type**: Problem  
**Recommended**: ✅ Error  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
SELECT * FROM a NATURAL JOIN b;
```

✅ Correct:

```sql
SELECT * FROM a JOIN b USING (id);
SELECT * FROM a JOIN b ON a.id = b.id;
```

### `postgresql/prefer-jsonb-over-json`

Warns on columns declared as `json`. `jsonb` stores the parsed representation, supports GIN indexes, and is what application code almost always wants. `json` only makes sense if you specifically need byte-exact round-tripping of the input text.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
CREATE TABLE events (payload JSON);
```

✅ Correct:

```sql
CREATE TABLE events (payload JSONB);
```

### `postgresql/prefer-identity-over-serial`

Warns on `SMALLSERIAL`, `SERIAL`, `BIGSERIAL` columns. The serial pseudo-types create a separately-owned sequence that does not survive pg_dump round-trips cleanly and does not honor column privileges. `GENERATED ... AS IDENTITY` is the SQL-standard replacement and has been the PostgreSQL team's recommendation since version 10.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
CREATE TABLE t (id BIGSERIAL);
CREATE TABLE t (id SERIAL);
```

✅ Correct:

```sql
CREATE TABLE t (id BIGINT GENERATED ALWAYS AS IDENTITY);
```

### `postgresql/require-primary-key`

Warns on `CREATE TABLE` statements without a primary key — either column-level (`id INT PRIMARY KEY`) or table-level (`PRIMARY KEY (id)`). Tables without a primary key cannot be replicated cleanly with logical replication, are hard to shard, and break most ORMs and migration tools. The rule does not flag `CREATE TABLE ... PARTITION OF ...` (no `tableElts`); a partition inherits its parent's primary key.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
CREATE TABLE t (id INT, name TEXT);
```

✅ Correct:

```sql
CREATE TABLE t (id INT PRIMARY KEY, name TEXT);
CREATE TABLE t (id INT, name TEXT, PRIMARY KEY (id));
```

### `postgresql/prefer-text-over-varchar`

Warns on `varchar(n)` columns. PostgreSQL stores `text` and `varchar(n)` the same way internally; the length is enforced by a per-table constraint that you cannot relax without rewriting the table. Use `text` and add a `CHECK (length(col) <= N)` constraint when you actually need a cap.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
CREATE TABLE users (name VARCHAR(255));
```

✅ Correct:

```sql
CREATE TABLE users (name TEXT);
CREATE TABLE users (name TEXT CHECK (length(name) <= 255));
```

`VARCHAR` without a length limit is also allowed.

### `postgresql/prefer-timestamptz`

Warns on `timestamp` (i.e. `timestamp without time zone`) columns. `timestamp` is timezone-naive: it stores the wall-clock literal you handed in and assumes every reader and writer share the same convention. Two clients with different `TimeZone` settings will disagree on which instant a row represents. `timestamptz` anchors everything to UTC at storage time and converts to the session timezone on read, which is what application code almost always wants.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
CREATE TABLE t (created_at TIMESTAMP);
```

✅ Correct:

```sql
CREATE TABLE t (created_at TIMESTAMPTZ);
CREATE TABLE t (created_at TIMESTAMP WITH TIME ZONE);
```

### `postgresql/no-money-type`

Errors on the `money` column type. Its output format and precision depend on the server's `lc_monetary` setting, so the same row prints differently on different servers and round-trips badly through clients. The PostgreSQL recommendation is `numeric` (and a separate currency column when you have more than one currency).

**Type**: Problem  
**Recommended**: ✅ Error  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
CREATE TABLE t (price MONEY);
```

✅ Correct:

```sql
CREATE TABLE t (price NUMERIC(10, 2), currency CHAR(3));
```

### `postgresql/no-char-type`

Warns on `char(n)` (a.k.a. `bpchar`) columns. PostgreSQL pads stored `char(n)` values to `n` with trailing spaces and silently trims on read; the padding surprises comparisons, sorts, and round-trip pipelines. Use `text` (and a `CHECK` constraint if you need a length).

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
CREATE TABLE t (code CHAR(3));
CREATE TABLE t (code BPCHAR(3));
```

✅ Correct:

```sql
CREATE TABLE t (code TEXT);
CREATE TABLE t (code TEXT CHECK (length(code) = 3));
```

### `postgresql/no-grant-to-public`

Warns on `GRANT ... TO PUBLIC`. The PUBLIC pseudo-role covers every current and future role in the database, including ones added later for unrelated services or admin tooling. Privilege grants should name the role(s) explicitly. Note that `REVOKE ... FROM PUBLIC` is unaffected — revoking the implicit grants is good hygiene.

**Type**: Problem  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
GRANT SELECT ON users TO PUBLIC;
```

✅ Correct:

```sql
GRANT SELECT ON users TO reporting;
REVOKE ALL ON users FROM PUBLIC;
```

### `postgresql/prefer-create-index-concurrently`

Warns on plain `CREATE INDEX` and recommends `CREATE INDEX CONCURRENTLY`. A non-concurrent index build takes a `SHARE` lock on the target table for the duration of the build — readers are unaffected, but every writer is blocked. Concurrent builds avoid the lock but cannot run inside a transaction — most migration tools therefore need an explicit per-step opt-out for this. Off by default because the right answer depends on your migration framework.

**Type**: Suggestion  
**Recommended**: ❌ Off by default  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
CREATE INDEX idx_users_email ON users (email);
```

✅ Correct:

```sql
CREATE INDEX CONCURRENTLY idx_users_email ON users (email);
```

### `postgresql/no-not-in-subquery`

Errors on `NOT IN (subquery)`. PostgreSQL's `NOT IN` returns **no rows** if the subquery yields a single NULL — semantically correct under three-valued logic, but virtually always not what application code wants. Use `NOT EXISTS (SELECT 1 FROM ... WHERE ...)`, which handles NULL the way humans expect. `NOT IN (1, 2, 3)` with a literal list is unaffected.

**Type**: Problem  
**Recommended**: ✅ Error  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM blocks);
```

✅ Correct:

```sql
SELECT id FROM users u WHERE NOT EXISTS (SELECT 1 FROM blocks b WHERE b.user_id = u.id);
SELECT 1 FROM users WHERE id NOT IN (1, 2, 3); -- literal list is fine
```

### `postgresql/snake-case-table-name`

Warns when a `CREATE TABLE` declares a table name that is not snake_case (lowercase letters, digits, and underscores; must start with a letter). Quoted mixed-case identifiers (`"UserAccounts"`) preserve their case and force every caller to quote them — a steady source of `relation does not exist` errors. Unquoted `CamelCase` is silently lowercased by PostgreSQL, so it passes.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
CREATE TABLE "UserAccounts" (id INT PRIMARY KEY);
```

✅ Correct:

```sql
CREATE TABLE user_accounts (id INT PRIMARY KEY);
CREATE TABLE UserAccounts (id INT PRIMARY KEY); -- folded to useraccounts
```

### `postgresql/snake-case-column-name`

Warns when a column declared in `CREATE TABLE` is not snake_case. Same rationale as `snake-case-table-name`: PostgreSQL preserves the case of quoted identifiers, so a quoted `"CamelCol"` forces every consumer to quote-match the name, while unquoted `CamelCol` silently lowercases to `camelcol` and passes.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
CREATE TABLE t ("CamelCol" INT);
```

✅ Correct:

```sql
CREATE TABLE t (camel_col INT);
CREATE TABLE t (CamelCol INT); -- folded to camelcol
```

### `postgresql/no-implicit-join`

Warns on `SELECT ... FROM a, b WHERE ...` style implicit joins. Comma syntax is an implicit cross join whose join condition is buried in `WHERE`; forgetting the condition silently produces a cartesian product. Explicit `JOIN ... ON ...` puts the join condition next to the join.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
SELECT a.id FROM a, b WHERE a.id = b.id;
```

✅ Correct:

```sql
SELECT a.id FROM a JOIN b ON a.id = b.id;
```

### `postgresql/require-limit`

Requires LIMIT clause in SELECT statements. Prevents accidentally retrieving large amounts of data.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
-- Missing LIMIT clause
SELECT * FROM users;
SELECT name, email FROM users WHERE active = true;
```

✅ Correct:

```sql
-- Has LIMIT clause
SELECT * FROM users LIMIT 100;
SELECT name, email FROM users WHERE active = true LIMIT 50;
```

### `postgresql/no-order-by-ordinal`

Disallows positional `ORDER BY` references such as `ORDER BY 1, 2`. Ordinals silently change meaning when the SELECT list is reordered or a column is inserted, and they're invisible at the call site of any view or CTE that contains them. Reference the column by name or by an alias instead.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
SELECT id, name FROM users ORDER BY 1;
SELECT id, name, email FROM users ORDER BY 1, 2 DESC;
```

✅ Correct:

```sql
SELECT id, name FROM users ORDER BY name;
SELECT id, name AS display_name FROM users ORDER BY display_name;
```

### `postgresql/no-group-by-ordinal`

Disallows positional `GROUP BY` references such as `GROUP BY 1, 2`. Same fragility as positional `ORDER BY`: reorder the SELECT list and the grouping silently shifts to a different column, often producing plausible-looking but wrong aggregates.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
SELECT category, count(*) FROM items GROUP BY 1;
SELECT region, category, sum(amount) FROM sales GROUP BY 1, 2;
```

✅ Correct:

```sql
SELECT category, count(*) FROM items GROUP BY category;
SELECT region, category, sum(amount) FROM sales GROUP BY region, category;
```

### `postgresql/no-distinct-on-without-order-by`

Errors on `SELECT DISTINCT ON (...)` queries that do not also specify `ORDER BY`. Without an explicit ordering PostgreSQL keeps an arbitrary row from each group, so the result depends on scan order and changes silently across plan or stats updates. Pair `DISTINCT ON` with an `ORDER BY` whose leading columns match the `DISTINCT ON` expressions so the surviving row is deterministic.

**Type**: Problem  
**Recommended**: ✅ Error  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
SELECT DISTINCT ON (customer_id) customer_id, amount FROM orders;
```

✅ Correct:

```sql
SELECT DISTINCT ON (customer_id) customer_id, amount
FROM orders
ORDER BY customer_id, created_at DESC;
```

### `postgresql/no-leading-wildcard-like`

Warns on `LIKE` / `ILIKE` patterns that begin with `%`. A pattern like `'%foo'` or `'%foo%'` cannot use a plain B-tree index and forces PostgreSQL into a sequential scan. If substring search is genuinely needed, use a `pg_trgm` GIN index, full-text search (`tsvector`), or rework the schema so the prefix is indexable.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
SELECT id FROM users WHERE email LIKE '%@example.com';
SELECT id FROM users WHERE name ILIKE '%smith%';
```

✅ Correct:

```sql
SELECT id FROM users WHERE email LIKE 'admin@%';
SELECT id FROM users WHERE email = 'admin@example.com';
```

### `postgresql/no-add-column-not-null-without-default`

Errors on `ALTER TABLE ... ADD COLUMN ... NOT NULL` that does not also specify a `DEFAULT`. On any non-empty table the migration aborts because every existing row needs a value for the new column. Either supply a `DEFAULT`, or add the column nullable, backfill, and `ALTER COLUMN ... SET NOT NULL` in a follow-up step.

**Type**: Problem  
**Recommended**: ✅ Error  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
ALTER TABLE users ADD COLUMN status text NOT NULL;
```

✅ Correct:

```sql
ALTER TABLE users ADD COLUMN status text NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN status text;
ALTER TABLE users ADD COLUMN id bigint GENERATED ALWAYS AS IDENTITY NOT NULL;
```

### `postgresql/no-select-into`

Warns on `SELECT ... INTO target FROM ...`, which silently creates a new table named `target`. The syntax is confusable with PL/pgSQL's `SELECT INTO variable` (a row assignment, not a table creation) and is omitted from many SQL primers. Use `CREATE TABLE target AS SELECT ...` so the intent reads back.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
SELECT id, name INTO archived_users FROM users WHERE inactive;
```

✅ Correct:

```sql
CREATE TABLE archived_users AS SELECT id, name FROM users WHERE inactive;
```

### `postgresql/prefer-coalesce-over-case`

Flags the verbose `CASE WHEN x IS NULL THEN fallback ELSE x END` (and its `IS NOT NULL` mirror) and recommends `COALESCE(x, fallback)`. `COALESCE` is shorter, evaluates `x` once, and is the form every PostgreSQL planner optimizes directly.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
SELECT CASE WHEN nickname IS NULL THEN full_name ELSE nickname END FROM users;
SELECT CASE WHEN nickname IS NOT NULL THEN nickname ELSE full_name END FROM users;
```

✅ Correct:

```sql
SELECT COALESCE(nickname, full_name) FROM users;
-- Multi-arm CASE that isn't just a null fallback is not flagged.
SELECT CASE
  WHEN nickname IS NULL THEN full_name
  WHEN length(nickname) = 0 THEN full_name
  ELSE nickname
END FROM users;
```

### `postgresql/no-having-without-group-by`

Errors on a `HAVING` clause that has no accompanying `GROUP BY`. The query is then a single aggregate over the entire table, which is almost always a mistake (the predicate belongs in `WHERE`). PostgreSQL accepts the form, so the planner won't catch it for you.

**Type**: Problem  
**Recommended**: ✅ Error  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
SELECT count(*) FROM users HAVING count(*) > 1;
```

✅ Correct:

```sql
SELECT category, count(*) FROM items GROUP BY category HAVING count(*) > 1;
SELECT count(*) FROM users WHERE active;
```

### `postgresql/no-alter-column-type`

Warns on `ALTER TABLE ... ALTER COLUMN ... TYPE ...`. PostgreSQL may need to rewrite every row (and every index) to change a column's type, all of it under an `ACCESS EXCLUSIVE` lock that blocks every other reader and writer. For non-trivial tables, add a new column, dual-write, backfill, and swap — or wrap the conversion in a separate, scheduled migration.

**Type**: Problem  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
ALTER TABLE users ALTER COLUMN id TYPE bigint;
```

✅ Correct:

```sql
-- Phase 1: add a new column, dual-write in app code.
ALTER TABLE users ADD COLUMN id_new bigint;
-- Phase 2 (later migration): backfill, swap, drop the old column.
```

### `postgresql/no-rename-column`

Warns on `ALTER TABLE ... RENAME COLUMN`. The rename completes atomically in the database, but every running app instance that still references the old name starts erroring the moment the migration runs. The safe pattern is add → dual-write → backfill → drop across separate deploys.

**Type**: Problem  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
ALTER TABLE users RENAME COLUMN email_address TO email;
```

✅ Correct:

```sql
-- Phase 1
ALTER TABLE users ADD COLUMN email text;
-- (Backfill, dual-write, drop old column in a later migration.)
```

### `postgresql/no-rename-table`

Warns on `ALTER TABLE ... RENAME TO`. Renaming a table is fast in the database but breaks every running app that still queries the old name. The safer pattern is to leave the old table in place as a view (`CREATE VIEW old_name AS SELECT * FROM new_name`) until callers are migrated, then drop the view in a separate deploy.

**Type**: Problem  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
ALTER TABLE legacy_users RENAME TO users;
```

✅ Correct:

```sql
CREATE TABLE users (id BIGINT PRIMARY KEY);
-- Migrate writers, then drop the legacy table in a later deploy.
```

### `postgresql/no-drop-column`

Warns on `ALTER TABLE ... DROP COLUMN`. Every running app that still reads the column starts failing the moment the migration runs. The two-step pattern is: stop reading/writing the column in the application and deploy, then drop it in a follow-up migration.

**Type**: Problem  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
ALTER TABLE users DROP COLUMN legacy_flag;
```

✅ Correct:

```sql
-- Phase 1: remove every read/write of legacy_flag in the app.
-- Phase 2 (separate deploy): then drop it.
ALTER TABLE users ADD COLUMN status text;
```

### `postgresql/no-drop-not-null`

Warns on `ALTER TABLE ... ALTER COLUMN ... DROP NOT NULL`. Relaxing the constraint lets the column store NULLs again — every consumer that already assumes the column is non-null (joins, `COALESCE` coverage, app-level types) silently breaks. If a row genuinely needs no value, model it with a sentinel or a separate optional table.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
```

✅ Correct:

```sql
ALTER TABLE users ALTER COLUMN status DROP DEFAULT;
```

### `postgresql/prefer-fk-not-valid`

Warns on `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY (...)` that does not include `NOT VALID`. Adding a foreign key normally validates every existing row under an `ACCESS EXCLUSIVE` lock that blocks writers for the full scan. The safer pattern is to add the constraint with `NOT VALID` (a fast metadata-only operation) and then `ALTER TABLE ... VALIDATE CONSTRAINT ...` in a separate migration — `VALIDATE` only takes a `SHARE UPDATE EXCLUSIVE` lock.

**Type**: Problem  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
ALTER TABLE orders
  ADD CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id) REFERENCES customers (id);
```

✅ Correct:

```sql
ALTER TABLE orders
  ADD CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id) REFERENCES customers (id) NOT VALID;

-- Later migration, no exclusive lock:
ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_fk;
```

### `postgresql/require-named-constraint`

Warns when a table-level `CHECK`, `UNIQUE`, `FOREIGN KEY`, or `EXCLUSION` constraint is declared without an explicit `CONSTRAINT <name>`. PostgreSQL invents a name for unnamed constraints (e.g., `items_code_key`); the generated name varies subtly across environments and migration tools, which makes later `DROP CONSTRAINT` / `ALTER CONSTRAINT` statements brittle. Column-level `NOT NULL` and `PRIMARY KEY` are allowed without names — the auto-generated names there are stable.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
CREATE TABLE items (id int, code text, UNIQUE (code));
ALTER TABLE items ADD CHECK (length(code) > 0);
```

✅ Correct:

```sql
CREATE TABLE items (
  id int,
  code text,
  CONSTRAINT items_code_unique UNIQUE (code)
);

ALTER TABLE items ADD CONSTRAINT items_code_non_empty CHECK (length(code) > 0);
```

### `postgresql/no-unlogged-table`

Warns on `CREATE UNLOGGED TABLE`. Unlogged tables skip WAL: they are truncated on crash, not replicated to standbys, and not restored from base backups. If a cache-style table is genuinely what you want, document it explicitly and disable this rule for that file.

**Type**: Problem  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
CREATE UNLOGGED TABLE session_cache (id text PRIMARY KEY);
```

✅ Correct:

```sql
CREATE TABLE session_cache (id text PRIMARY KEY);
```

### `postgresql/no-temporary-table`

Warns on `CREATE TEMP TABLE` / `CREATE TEMPORARY TABLE`. Temporary tables exist only for the current session and disappear when the connection closes — they almost never belong in versioned SQL. If session-scoped scratch storage is genuinely needed, build it from application code.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
CREATE TEMP TABLE staging (id int);
```

✅ Correct:

```sql
CREATE TABLE staging (id int);
```

### `postgresql/no-numeric-without-precision`

Warns on `NUMERIC` (and the `DECIMAL` synonym) declared without an explicit precision and scale. Bare `NUMERIC` accepts unbounded magnitude — useful only if you really do mean "arbitrary precision," which is rarely the case in application schemas. Declare `NUMERIC(precision, scale)` so the column documents the value's domain.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
CREATE TABLE products (price numeric);
CREATE TABLE products (price decimal);
```

✅ Correct:

```sql
CREATE TABLE products (price numeric(10, 2));
```

### `postgresql/no-time-type`

Warns on `TIME` and `TIME WITH TIME ZONE` (`timetz`) columns. `time` has no date and cannot disambiguate around DST transitions; `timetz` stores an offset that is meaningless without a date. Use `timestamptz` for points in time, `interval` for durations, or `text` if all you really need is a display value.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
CREATE TABLE shifts (id int, start_at time);
CREATE TABLE shifts (id int, start_at timetz);
```

✅ Correct:

```sql
CREATE TABLE shifts (id int, start_at timestamptz);
CREATE TABLE jobs (id int, duration interval);
```

### `postgresql/no-set-not-null`

Warns on `ALTER TABLE ... ALTER COLUMN ... SET NOT NULL`. PostgreSQL has to scan the whole table to verify the column has no nulls, and it holds an `ACCESS EXCLUSIVE` lock for the duration. The production-safe pattern (PG ≥ 12) is to add a `CHECK (col IS NOT NULL) NOT VALID` constraint, `VALIDATE CONSTRAINT` separately (no exclusive lock), then `SET NOT NULL` — PG reuses the validated CHECK and skips the scan.

**Type**: Problem  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
```

✅ Correct:

```sql
-- Phase 1: cheap metadata-only.
ALTER TABLE users ADD CONSTRAINT users_email_not_null CHECK (email IS NOT NULL) NOT VALID;
-- Phase 2 (separate migration): no exclusive lock, only scans uncommitted rows.
ALTER TABLE users VALIDATE CONSTRAINT users_email_not_null;
-- Phase 3 (optional): now `SET NOT NULL` is instant.
```

### `postgresql/no-set-search-path`

Warns on `SET search_path = ...` in versioned SQL. The statement changes name resolution for the rest of the session and is a known footgun: a security-definer function written under one search_path may run under another in production, and `CREATE TABLE foo` may target a schema you didn't intend. Qualify identifiers (`audit.events`, `public.users`) instead.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
SET search_path TO audit, public;
```

✅ Correct:

```sql
SELECT id FROM audit.events;
```

### `postgresql/require-schema-qualified-table`

Warns on `CREATE TABLE foo (...)` without a schema-qualified name. Without an explicit schema, the target depends on the current `search_path` and may land in an unintended schema. This rule is **off** by default in `configs.recommended` because many projects intentionally keep everything in `public`; enable it explicitly for codebases that organize by schema.

**Type**: Suggestion  
**Recommended**: ❌ Off by default  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
CREATE TABLE users (id bigint PRIMARY KEY);
```

✅ Correct:

```sql
CREATE TABLE app.users (id bigint PRIMARY KEY);
```

### `postgresql/prefer-explicit-null-ordering`

Warns when an `ORDER BY` term specifies an explicit `ASC` / `DESC` / `USING` direction but no `NULLS FIRST` / `NULLS LAST`. PostgreSQL's defaults (NULLS LAST for ASC, NULLS FIRST for DESC) match the SQL spec but contradict every other major engine, and even within PG it is a common cause of surprise when nulls cluster at the "wrong" end of a result set.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
SELECT id FROM users ORDER BY created_at DESC;
```

✅ Correct:

```sql
SELECT id FROM users ORDER BY created_at DESC NULLS LAST;
-- Plain ORDER BY without an explicit direction is not flagged.
SELECT id FROM users ORDER BY created_at;
```

### `postgresql/no-vacuum-full`

Warns on `VACUUM FULL`. It takes an `ACCESS EXCLUSIVE` lock and rewrites the entire table, making the table unavailable for the duration. For shrinking a bloated table on a live database, use `pg_repack` or `pg_squeeze`; a plain `VACUUM` (no `FULL`) is fine and does not block readers or writers.

**Type**: Problem  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
VACUUM FULL users;
```

✅ Correct:

```sql
VACUUM users;
VACUUM ANALYZE users;
```

### `postgresql/no-cluster`

Warns on the `CLUSTER` statement. Like `VACUUM FULL`, it takes `ACCESS EXCLUSIVE` and rewrites the table. PostgreSQL does not keep rows clustered as you continue to write — every subsequent `CLUSTER` must rewrite everything again. Use `pg_repack --order-by` for online clustering, or build the index in the order you actually want to read.

**Type**: Problem  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
CLUSTER users USING users_pkey;
```

✅ Correct:

```sql
VACUUM users;
-- Or: pg_repack --order-by from outside SQL.
```

## Configuration Examples

### Project Usage Example

```javascript
// eslint.config.js
import postgresql from "eslint-plugin-postgresql";

export default [
  // Other ESLint configurations...

  // Configuration for SQL files
  {
    files: ["**/*.sql"],
    ...postgresql.configs.recommended,
  },

  // Custom configuration for specific directories
  {
    files: ["migrations/**/*.sql"],
    languageOptions: {
      parser: postgresql.configs.recommended.languageOptions.parser,
    },
    plugins: {
      postgresql,
    },
    rules: {
      "postgresql/no-syntax-error": "error",
      "postgresql/require-limit": "off", // Disable LIMIT requirement for migration files
    },
  },
];
```

## Development

### Project Setup

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint:check

# Check formatting
pnpm format:check
```

### Creating New Rules

```bash
# Script to create new rules
pnpm create-rule
```

### Testing

```bash
pnpm test
```

## Contributing

Pull requests and issues are welcome! We look forward to new rule ideas and bug reports.

## License

MIT

## Related Projects

- [postgresql-eslint-parser](https://github.com/baseballyama/postgresql-eslint-parser) - PostgreSQL parser used by this plugin
- [libpg-query](https://github.com/pganalyze/libpg-query-node) - PostgreSQL syntax parsing library
