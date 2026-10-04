// Temporary (removed before merge): differential check between the published
// eslint-plugin-postgresql@0.24.0 and this branch's build. Both plugins run
// against the same postgresql-eslint-parser and every fixture under
// tests/fixtures, so any change in what users see is reported.
import { readdirSync, readFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { Linter } from "eslint";
import { parse as parseYaml } from "yaml";
import parser from "postgresql-eslint-parser";

const [baseDir, headDir] = process.argv.slice(2);
const base = (await import(join(baseDir, "dist/index.js"))).default;
const head = (await import(join(headDir, "dist/index.js"))).default;
const out = [];
let failures = 0;
const fail = (msg) => {
  failures++;
  out.push(`- ❌ ${msg}`);
};
const stable = (v) =>
  JSON.stringify(v, (_k, x) => (typeof x === "function" ? "[fn]" : x));

// 1. Public surface
const baseRules = Object.keys(base.rules).sort();
const headRules = Object.keys(head.rules).sort();
if (stable(baseRules) !== stable(headRules))
  fail(`rule names differ: ${stable(baseRules)} vs ${stable(headRules)}`);
for (const name of baseRules) {
  if (stable(base.rules[name].meta) !== stable(head.rules[name]?.meta))
    fail(`meta differs for ${name}`);
}
for (const cfg of Object.keys({ ...base.configs, ...head.configs })) {
  const b = {
    ...base.configs[cfg],
    plugins: undefined,
    languageOptions: undefined,
  };
  const h = {
    ...head.configs[cfg],
    plugins: undefined,
    languageOptions: undefined,
  };
  if (stable(b) !== stable(h)) fail(`configs.${cfg} differs`);
}
if (
  stable(Object.keys(base.processors ?? {})) !==
  stable(Object.keys(head.processors ?? {}))
)
  fail("processors differ");
out.push(
  `- rules: ${headRules.length}, configs: ${Object.keys(head.configs).join(", ")}, processors: ${Object.keys(head.processors ?? {}).join(", ")}`,
);

// 2. Behaviour on every fixture
const run = (plugin, code, rules) => {
  const linter = new Linter({ configType: "flat" });
  const config = {
    files: ["**/*.sql"],
    plugins: { postgresql: plugin },
    languageOptions: { parser },
    rules,
  };
  const messages = linter.verify(code, config, "fixture.sql");
  const fixed = linter.verifyAndFix(code, config, "fixture.sql").output;
  return stable({ messages, fixed });
};
const allRules = Object.fromEntries(
  headRules.map((r) => [`postgresql/${r}`, "error"]),
);
const fixturesRoot = join(process.cwd(), "tests/fixtures");
let files = 0,
  perRule = 0;
for (const rule of readdirSync(fixturesRoot)) {
  for (const kind of ["valid", "invalid"]) {
    const dir = join(fixturesRoot, rule, kind);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((n) => n.endsWith(".sql"))) {
      const code = readFileSync(join(dir, f), "utf8");
      const yamlPath = join(dir, f.replace(/\.sql$/, ".yaml"));
      const options = existsSync(yamlPath)
        ? (parseYaml(readFileSync(yamlPath, "utf8"))?.options ?? [])
        : [];
      files++;
      if (run(base, code, allRules) !== run(head, code, allRules))
        fail(`all-rules output differs: ${rule}/${kind}/${f}`);
      if (headRules.includes(rule)) {
        perRule++;
        const rules = { [`postgresql/${rule}`]: ["error", ...options] };
        if (run(base, code, rules) !== run(head, code, rules))
          fail(`${rule} output differs: ${kind}/${f}`);
      }
    }
  }
}
out.push(
  `- fixtures compared: ${files} with all rules, ${perRule} with their own rule and options`,
);
out.unshift(
  `### Differential check: eslint-plugin-postgresql@0.24.0 vs this build — ${failures ? `${failures} difference(s)` : "no differences"}`,
);
const report = out.join("\n") + "\n";
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
process.exit(failures ? 1 : 0);
