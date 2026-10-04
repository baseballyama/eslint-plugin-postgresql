import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

// GitHub Pages serves the site under the repository name unless a custom
// domain is configured. `BASE_PATH` lets CI override it (set to "" for a
// user/org pages site or a CNAME deployment).
const base =
  process.env.BASE_PATH ??
  (process.env.NODE_ENV === "production" ? "/eslint-plugin-postgresql" : "");

export default defineConfig({
  plugins: [
    sveltekit({
      preprocess: vitePreprocess(),
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
    }),
  ],
  worker: {
    format: "es",
  },
  // libpg-query ships an emscripten loader that uses a CJS-style default
  // export. Letting Vite's pre-bundler include it converts the loader to
  // ESM so `import { parse } from "libpg-query"` works in both dev and
  // build.
  optimizeDeps: {
    include: ["libpg-query"],
  },
  assetsInclude: ["**/*.wasm"],
  build: {
    target: "es2022",
  },
});
