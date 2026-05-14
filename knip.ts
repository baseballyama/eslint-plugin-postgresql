import type { KnipConfig } from "knip/dist";

const config = {
  entry: ["src/index.ts", "rolldown.config.js"],
  project: ["**/*.{js,ts}"],
  oxlint: {},
  vitest: {},
  // The docs site (site/) is its own SvelteKit project with a separate
  // package.json, lockfile and entry graph. Knip can't follow Svelte route
  // conventions from here — let the site own its own audit if it ever needs
  // one.
  ignore: ["tests/fixtures/**/*", "site/**"],
  ignoreDependencies: ["libpg-query", "@changesets/changelog-github"],
} as const satisfies KnipConfig;

export default config;
