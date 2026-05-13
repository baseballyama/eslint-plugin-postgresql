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
