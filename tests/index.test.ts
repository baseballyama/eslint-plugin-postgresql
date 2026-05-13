import { describe, expect, it } from "vitest";
import plugin from "../src/index.js";

describe("eslint-plugin-postgresql", () => {
  it("exports a plugin object", () => {
    expect(plugin).toBeDefined();
    expect(typeof plugin).toBe("object");
  });

  it("has a complete meta block", () => {
    expect(plugin.meta?.name).toBe("eslint-plugin-postgresql");
    expect(typeof plugin.meta?.version).toBe("string");
  });

  it("registers at least one rule and every registered rule is well-formed", () => {
    expect(plugin.rules).toBeDefined();
    const entries = Object.entries(plugin.rules ?? {});
    expect(entries.length).toBeGreaterThan(0);
    for (const [name, rule] of entries) {
      expect(rule, `${name} should be a rule object`).toBeDefined();
      const meta = (rule as { meta?: unknown }).meta;
      expect(meta, `${name} is missing meta`).toBeDefined();
      const create = (rule as { create?: unknown }).create;
      expect(typeof create, `${name} is missing create()`).toBe("function");
    }
  });

  it("ships configs.recommended that binds the plugin and references real rules", () => {
    const recommended = plugin.configs?.["recommended"];
    expect(recommended).toBeDefined();
    if (!recommended || typeof recommended !== "object") return;

    // Plugin must be bound under the `postgresql` namespace so the rule
    // severities below resolve.
    const plugins = (recommended as { plugins?: Record<string, unknown> })
      .plugins;
    expect(plugins?.["postgresql"]).toBe(plugin);

    // Every rule severity in `recommended` must reference a rule that
    // actually exists in `plugin.rules`. This catches the drift class
    // where a recommended-config entry points at a typo or removed rule.
    const rules = (recommended as { rules?: Record<string, unknown> }).rules;
    expect(rules).toBeDefined();
    for (const key of Object.keys(rules ?? {})) {
      expect(key.startsWith("postgresql/"), `${key} missing namespace`).toBe(
        true,
      );
      const ruleName = key.slice("postgresql/".length);
      expect(
        plugin.rules?.[ruleName],
        `recommended references unknown rule "${ruleName}"`,
      ).toBeDefined();
    }
  });
});
