# postgresql-eslint-parser

A PostgreSQL SQL parser for ESLint.

## Installation

```bash
npm install postgresql-eslint-parser
```

## Usage

```javascript
import parser from "postgresql-eslint-parser";

// Parse SQL code
const ast = parser.parse("SELECT * FROM users WHERE id = 1");

// Parse for ESLint (includes visitor keys and scope manager)
const { ast, visitorKeys, scopeManager } = parser.parseForESLint(
  "SELECT * FROM users WHERE id = 1",
);
```

## ESLint Integration

### Using as ESLint Parser

Configure the parser in your ESLint configuration file:

#### ESLint Flat Config (eslint.config.js)

```javascript
import postgresqlParser from "postgresql-eslint-parser";

export default [
  {
    files: ["**/*.sql"],
    languageOptions: {
      parser: postgresqlParser,
    },
    rules: {
      // Your SQL-specific rules here
    },
  },
];
```

## Features

- 🔍 **PostgreSQL SQL parsing** - Powered by `libpg-query` (<https://github.com/launchql/libpg-query-node>)
- 🌳 **ESTree-compatible AST** - Works seamlessly with ESLint
- 🎯 **ESLint integration** - Provides `parseForESLint` function with visitor keys
- 📍 **Source location tracking** - Includes line/column information for all nodes
- 🏷️ **Token support** - Generates tokens for syntax highlighting and analysis

## API

### `parse(code: string): Program`

Parses SQL code and returns an ESTree Program node.

### `parseForESLint(code: string): ParseResult`

Parses SQL code for ESLint usage, returning an object with:

- `ast`: The ESTree Program node
- `visitorKeys`: Visitor key mappings for AST traversal
- `scopeManager`: Scope manager (currently `null`)
