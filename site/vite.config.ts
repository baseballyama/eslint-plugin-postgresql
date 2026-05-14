import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
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
