import { defineConfig, type ViteUserConfig } from "vitest/config";

const config: ViteUserConfig = defineConfig({
  test: {
    coverage: {
      include: ["src/**"],
      reporter: ["text", "json-summary", "json"],
    },
  },
});

export default config;
