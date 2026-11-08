#!/usr/bin/env node
// Load the built plugin through its package name, as a consumer does, and
// parse one statement. The bundle inlines `postgresql-eslint-parser`, so the
// tests on `src/` can't tell whether everything the bundle loads at runtime is
// declared in package.json.

import { readFileSync } from "node:fs";
import postgresql from "eslint-plugin-postgresql";

const RUNTIME_DEPENDENCY = "@libpg-query/parser";
const BUNDLED_PARSER = "postgresql-eslint-parser";
const CARET_RANGE = /^\^(\d+)\.(\d+)\.(\d+)$/u;

// The lockfile may resolve a newer `@libpg-query/parser` than the declared
// floor, so loading alone doesn't prove the floor is high enough. Require our
// range to start at or above the one the bundled parser declares.
function caretFloor(range, owner) {
  const match = CARET_RANGE.exec(range);
  if (!match) {
    throw new Error(
      `${owner} declares ${RUNTIME_DEPENDENCY} as "${range}"; expected ^x.y.z.`,
    );
  }
  return match.slice(1).map(Number);
}

// The parser's `exports` hides its package.json, so read it from disk.
function declaredRange(path) {
  const manifest = JSON.parse(
    readFileSync(new URL(path, import.meta.url), "utf8"),
  );
  return manifest.dependencies[RUNTIME_DEPENDENCY];
}

const ownRange = declaredRange("../package.json");
const parserRange = declaredRange(
  `../node_modules/${BUNDLED_PARSER}/package.json`,
);
const own = caretFloor(ownRange, "package.json");
const parser = caretFloor(parserRange, BUNDLED_PARSER);
const firstDiff = own.findIndex((part, i) => part !== parser[i]);
if (
  own[0] !== parser[0] ||
  (firstDiff !== -1 && own[firstDiff] < parser[firstDiff])
) {
  throw new Error(
    `package.json declares ${RUNTIME_DEPENDENCY} "${ownRange}", but the bundled ${BUNDLED_PARSER} needs "${parserRange}". Raise package.json's range to match.`,
  );
}

postgresql.configs.recommended.languageOptions.parser.parseForESLint(
  "SELECT 1;",
);
