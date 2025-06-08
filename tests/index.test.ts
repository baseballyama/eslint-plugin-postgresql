import { describe, it, expect } from "vitest";
import plugin from "../src/index.js";

describe("eslint-plugin-postgresql", () => {
  it("should export plugin", () => {
    expect(plugin).toBeDefined();
    expect(typeof plugin).toBe("object");
  });

  it("should have meta information", () => {
    expect(plugin.meta).toBeDefined();
    if (plugin.meta) {
      expect(plugin.meta.name).toBe("eslint-plugin-postgresql");
      expect(plugin.meta.version).toBeDefined();
    }
  });

  it("should have rules", () => {
    expect(plugin.rules).toBeDefined();
    if (plugin.rules) {
      expect(plugin.rules["no-syntax-error"]).toBeDefined();
    }
  });

  it("should have configs", () => {
    expect(plugin.configs).toBeDefined();
  });
});
