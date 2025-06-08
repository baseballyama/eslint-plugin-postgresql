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
