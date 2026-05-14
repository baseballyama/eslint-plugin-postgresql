import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

// GitHub Pages serves the site under the repository name unless a custom
// domain is configured. `BASE_PATH` lets CI override it (set to "" for a
// user/org pages site or a CNAME deployment).
const base =
  process.env.BASE_PATH ?? (process.env.NODE_ENV === "production" ? "/eslint-plugin-postgresql" : "");

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: "build",
      assets: "build",
      fallback: "404.html",
      precompress: false,
      strict: true,
    }),
    paths: {
      base,
    },
    prerender: {
      handleHttpError: "warn",
    },
  },
};

export default config;
