---
"eslint-plugin-postgresql": patch
---

Depend on `@libpg-query/parser` instead of `postgresql-eslint-parser`. The
plugin bundles the parser's code, and that code loads `@libpg-query/parser` at
runtime, but the plugin relied on the package manager hoisting it to where the
plugin could find it. In a layout that exposes only declared dependencies,
loading the plugin failed with `Cannot find module '@libpg-query/parser'`.
`postgresql-eslint-parser` moves to `devDependencies`, so installs no longer
download it.
