import type { KnipConfig } from "knip/dist";

const config = {
  project: ["**/*.{js,ts}"],
  oxlint: {},
  vitest: {},
  // The docs site (site/) is its own SvelteKit project with a separate
  // package.json, lockfile and entry graph. Knip can't follow Svelte route
  // conventions from here — let the site own its own audit if it ever needs
  // one.
  ignore: ["site/**"],
  // Only the bundled postgresql-eslint-parser loads this, through
  // `createRequire().resolve()`, so knip can't see it from src/.
  // scripts/check-dist.js fails if it's missing.
  ignoreDependencies: ["@libpg-query/parser"],
} as const satisfies KnipConfig;

export default config;
