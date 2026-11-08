#!/usr/bin/env node
// Load the built plugin through its package name, as a consumer does, and
// parse one statement. The bundle inlines `postgresql-eslint-parser`, so the
// tests on `src/` can't tell whether everything the bundle loads at runtime is
// declared in package.json.

import postgresql from "eslint-plugin-postgresql";

postgresql.configs.recommended.languageOptions.parser.parseForESLint(
  "SELECT 1;",
);
