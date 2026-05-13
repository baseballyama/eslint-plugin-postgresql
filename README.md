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
### `postgresql/no-money-type`

Errors on the `money` column type. Its output format and precision depend on the server's `lc_monetary` setting, so the same row prints differently on different servers and round-trips badly through clients. The PostgreSQL recommendation is `numeric` (and a separate currency column when you have more than one currency).

**Type**: Problem  
**Recommended**: ✅ Error  
### `postgresql/prefer-create-index-concurrently`

Warns on plain `CREATE INDEX` and recommends `CREATE INDEX CONCURRENTLY`. A non-concurrent index build takes a `SHARE` lock on the target table for the duration of the build — readers are unaffected, but every writer is blocked. Concurrent builds avoid the lock but cannot run inside a transaction — most migration tools therefore need an explicit per-step opt-out for this. Off by default because the right answer depends on your migration framework.

**Type**: Suggestion  
**Recommended**: ❌ Off by default  
### `postgresql/no-not-in-subquery`

Errors on `NOT IN (subquery)`. PostgreSQL's `NOT IN` returns **no rows** if the subquery yields a single NULL — semantically correct under three-valued logic, but virtually always not what application code wants. Use `NOT EXISTS (SELECT 1 FROM ... WHERE ...)`, which handles NULL the way humans expect. `NOT IN (1, 2, 3)` with a literal list is unaffected.

**Type**: Problem  
**Recommended**: ✅ Error  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
SELECT * FROM users;
SELECT u.* FROM users u;
CREATE TABLE t (price MONEY);
CREATE INDEX idx_users_email ON users (email);
SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM blocks);
```

✅ Correct:

```sql
SELECT id, name FROM users;
SELECT count(*) FROM users; -- aggregate star is fine
```

### `postgresql/require-where-in-delete`

Errors on `DELETE` statements that have no `WHERE` clause — deleting every row in a table is almost always a mistake. Use `TRUNCATE` if you really mean to empty the table.

### `postgresql/require-where-in-update`

Errors on `UPDATE` statements without a `WHERE` clause — updating every row in a table is almost always a mistake.

**Type**: Problem  
**Recommended**: ✅ Error  
### `postgresql/no-drop-table-cascade`

Warns on `DROP TABLE ... CASCADE`. `CASCADE` silently removes dependent objects (views, foreign keys, sequences) and is one of the most common ways migrations destroy more than intended. The fix is to list the dependents explicitly. The rule scopes to `DROP TABLE` to match its name; other `DROP ... CASCADE` variants (schema, type, etc.) are not covered.
### `postgresql/no-truncate-cascade`

Warns on `TRUNCATE ... CASCADE`. CASCADE on TRUNCATE transitively empties every table that has a foreign key referencing the target, which is essentially never the right tool for the intended operation.

**Type**: Problem  
### `postgresql/no-cross-join`

Warns on `CROSS JOIN` (cartesian product without a join condition). Almost always a mistake — if the intent really is a cartesian product, write `JOIN ... ON true` so the intent is visible. Note that `INNER JOIN b` without `ON`/`USING` is a parser error in PostgreSQL, so the only shape this rule actually fires on in practice is the explicit `CROSS JOIN`.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
### `postgresql/no-natural-join`

Errors on `NATURAL JOIN`. The join columns are implicit — any new column added to either side later with a matching name silently changes the join. Use `JOIN ... USING (...)` or `JOIN ... ON ...` to name the columns.

**Type**: Problem  
**Recommended**: ✅ Error  
### `postgresql/prefer-jsonb-over-json`

Warns on columns declared as `json`. `jsonb` stores the parsed representation, supports GIN indexes, and is what application code almost always wants. `json` only makes sense if you specifically need byte-exact round-tripping of the input text.
### `postgresql/prefer-identity-over-serial`

Warns on `SMALLSERIAL`, `SERIAL`, `BIGSERIAL` columns. The serial pseudo-types create a separately-owned sequence that does not survive pg_dump round-trips cleanly and does not honor column privileges. `GENERATED ... AS IDENTITY` is the SQL-standard replacement and has been the PostgreSQL team's recommendation since version 10.
### `postgresql/require-primary-key`

Warns on `CREATE TABLE` statements without a primary key — either column-level (`id INT PRIMARY KEY`) or table-level (`PRIMARY KEY (id)`). Tables without a primary key cannot be replicated cleanly with logical replication, are hard to shard, and break most ORMs and migration tools. The rule does not flag `CREATE TABLE ... PARTITION OF ...` (no `tableElts`); a partition inherits its parent's primary key.
### `postgresql/prefer-text-over-varchar`

Warns on `varchar(n)` columns. PostgreSQL stores `text` and `varchar(n)` the same way internally; the length is enforced by a per-table constraint that you cannot relax without rewriting the table. Use `text` and add a `CHECK (length(col) <= N)` constraint when you actually need a cap.
### `postgresql/prefer-timestamptz`

Warns on `timestamp` (i.e. `timestamp without time zone`) columns. `timestamp` is timezone-naive: it stores the wall-clock literal you handed in and assumes every reader and writer share the same convention. Two clients with different `TimeZone` settings will disagree on which instant a row represents. `timestamptz` anchors everything to UTC at storage time and converts to the session timezone on read, which is what application code almost always wants.
### `postgresql/no-char-type`

Warns on `char(n)` (a.k.a. `bpchar`) columns. PostgreSQL pads stored `char(n)` values to `n` with trailing spaces and silently trims on read; the padding surprises comparisons, sorts, and round-trip pipelines. Use `text` (and a `CHECK` constraint if you need a length).

**Type**: Suggestion  
### `postgresql/no-grant-to-public`

Warns on `GRANT ... TO PUBLIC`. The PUBLIC pseudo-role covers every current and future role in the database, including ones added later for unrelated services or admin tooling. Privilege grants should name the role(s) explicitly. Note that `REVOKE ... FROM PUBLIC` is unaffected — revoking the implicit grants is good hygiene.

**Type**: Problem  
### `postgresql/snake-case-table-name`

Warns when a `CREATE TABLE` declares a table name that is not snake_case (lowercase letters, digits, and underscores; must start with a letter). Quoted mixed-case identifiers (`"UserAccounts"`) preserve their case and force every caller to quote them — a steady source of `relation does not exist` errors. Unquoted `CamelCase` is silently lowercased by PostgreSQL, so it passes.
### `postgresql/snake-case-column-name`

Warns when a column declared in `CREATE TABLE` is not snake_case. Same rationale as `snake-case-table-name`: PostgreSQL preserves the case of quoted identifiers, so a quoted `"CamelCol"` forces every consumer to quote-match the name, while unquoted `CamelCol` silently lowercases to `camelcol` and passes.

**Type**: Suggestion  
**Recommended**: ⚠️ Warn  
**Fixable**: ❌ No

#### Examples

❌ Incorrect:

```sql
DELETE FROM users;
UPDATE users SET active = false;
DROP TABLE users CASCADE;
TRUNCATE users CASCADE;
SELECT * FROM a CROSS JOIN b;
SELECT * FROM a NATURAL JOIN b;
CREATE TABLE events (payload JSON);
CREATE TABLE t (id BIGSERIAL);
CREATE TABLE t (id SERIAL);
CREATE TABLE t (id INT, name TEXT);
CREATE TABLE users (name VARCHAR(255));
CREATE TABLE t (created_at TIMESTAMP);
CREATE TABLE t (code CHAR(3));
CREATE TABLE t (code BPCHAR(3));
GRANT SELECT ON users TO PUBLIC;
CREATE TABLE "UserAccounts" (id INT PRIMARY KEY);
CREATE TABLE t ("CamelCol" INT);
```

✅ Correct:

```sql
DELETE FROM users WHERE id = 1;
DELETE FROM sessions WHERE expires_at < now();
UPDATE users SET active = false WHERE id = 1;
DROP TABLE users;
DROP TABLE users RESTRICT;
TRUNCATE users;
TRUNCATE users RESTRICT;
SELECT * FROM a JOIN b ON a.id = b.id;
SELECT * FROM a INNER JOIN b USING (id);
SELECT * FROM a JOIN b ON true; -- intentional cartesian
SELECT * FROM a JOIN b USING (id);
SELECT * FROM a JOIN b ON a.id = b.id;
CREATE TABLE events (payload JSONB);
CREATE TABLE t (id BIGINT GENERATED ALWAYS AS IDENTITY);
CREATE TABLE t (id INT PRIMARY KEY, name TEXT);
CREATE TABLE t (id INT, name TEXT, PRIMARY KEY (id));
```

CREATE TABLE users (name TEXT);
CREATE TABLE users (name TEXT CHECK (length(name) <= 255));
```

`VARCHAR` without a length limit is also allowed.

CREATE TABLE t (created_at TIMESTAMPTZ);
CREATE TABLE t (created_at TIMESTAMP WITH TIME ZONE);
CREATE TABLE t (price NUMERIC(10, 2), currency CHAR(3));
CREATE TABLE t (code TEXT);
CREATE TABLE t (code TEXT CHECK (length(code) = 3));
GRANT SELECT ON users TO reporting;
REVOKE ALL ON users FROM PUBLIC;
CREATE INDEX CONCURRENTLY idx_users_email ON users (email);
SELECT id FROM users u WHERE NOT EXISTS (SELECT 1 FROM blocks b WHERE b.user_id = u.id);
SELECT 1 FROM users WHERE id NOT IN (1, 2, 3); -- literal list is fine
CREATE TABLE user_accounts (id INT PRIMARY KEY);
CREATE TABLE UserAccounts (id INT PRIMARY KEY); -- folded to useraccounts
CREATE TABLE t (camel_col INT);
CREATE TABLE t (CamelCol INT); -- folded to camelcol
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
