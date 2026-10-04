// Temporary consumer check: import the installed plugin and lint sample SQL
// exactly as a user's eslint.config.js would. Fails on any fatal parse error
// for valid SQL, or if the plugin cannot be loaded.
import { createRequire } from "node:module";
import { ESLint } from "eslint";
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// These packages are ESM-only and do not export ./package.json, so walk the
// node_modules directories the way Node's resolver does, from the directory
// of the package that depends on them.
const pkgOf = (name, fromDir) => {
  for (let dir = realpathSync(fromDir); ; dir = dirname(dir)) {
    const candidate = join(dir, "node_modules", name, "package.json");
    if (existsSync(candidate)) {
      return { dir: realpathSync(dirname(candidate)), version: JSON.parse(readFileSync(candidate, "utf8")).version };
    }
    if (dir === dirname(dir)) throw new Error(`${name} not found from ${fromDir}`);
  }
};
const pluginPkg = pkgOf("eslint-plugin-postgresql", process.cwd());
const parserPkg = pkgOf("postgresql-eslint-parser", pluginPkg.dir);
const libpgPkg = pkgOf("@libpg-query/parser", parserPkg.dir);
console.log(`plugin ${pluginPkg.version}, parser ${parserPkg.version}, @libpg-query/parser ${libpgPkg.version}, eslint ${pkgOf("eslint", process.cwd()).version}`);

const { default: plugin } = await import("eslint-plugin-postgresql");
console.log(`rules: ${Object.keys(plugin.rules).length}`);

writeFileSync("good.sql", "SELECT id, name\nFROM users\nWHERE id = 1;\n");
writeFileSync("style.sql", "select * from users;\n");
writeFileSync("bad.sql", "SELECT 'unterminated string FROM users;\n");
writeFileSync(
  "eslint.config.js",
  'import postgresql from "eslint-plugin-postgresql";\nexport default [{ files: ["**/*.sql"], ...postgresql.configs.recommended }];\n',
);

const results = await new ESLint().lintFiles(["good.sql", "style.sql", "bad.sql"]);
let failed = false;
for (const r of results) {
  const name = r.filePath.split("/").pop();
  for (const m of r.messages) console.log(`${name}:${m.line}:${m.column} ${m.ruleId ?? "(fatal)"} ${m.message}`);
  if (r.messages.length === 0) console.log(`${name}: no messages`);
  if (name !== "bad.sql" && r.messages.some((m) => m.fatal)) failed = true;
}
const bad = results.find((r) => r.filePath.endsWith("bad.sql")).messages;
if (bad.length === 0 || bad.some((m) => /is not valid JSON/.test(m.message))) {
  console.log("bad.sql: syntax error is missing or replaced by a JSON parse error");
  failed = true;
}
process.exitCode = failed ? 1 : 0;

// The embedded-sql processor on Prisma's tags, through the installed plugin.
writeFileSync("prisma.ts", "const rows = await prisma.$queryRaw`SELECT * FROM users`;\nawait prisma.$executeRaw`DELETE FROM sessions`;\n");
writeFileSync(
  "eslint.embedded.config.js",
  // Same shape as the README: the processor on the host files, and the
  // recommended preset on **/*.sql, which also matches the virtual files.
  'import postgresql from "eslint-plugin-postgresql";\nexport default [{ files: ["**/*.ts"], processor: postgresql.processors["embedded-sql"] }, { files: ["**/*.sql"], ...postgresql.configs.recommended, rules: { ...postgresql.configs.recommended.rules, "postgresql/no-select-star": "error", "postgresql/require-where-in-delete": "error" } }];\n',
);
const [prisma] = await new ESLint({ overrideConfigFile: "eslint.embedded.config.js" }).lintFiles(["prisma.ts"]);
const got = prisma.messages.filter((m) => m.fatal || ["postgresql/no-select-star", "postgresql/require-where-in-delete"].includes(m.ruleId)).map((m) => `${m.ruleId ?? "(fatal)"}@${m.line}:${m.column}`);
console.log(`prisma.ts: ${got.join(", ") || "no messages"}`);
if (JSON.stringify(got) !== JSON.stringify(["postgresql/no-select-star@1:44", "postgresql/require-where-in-delete@2:26"])) {
  console.log("prisma.ts: expected no-select-star@1:44 and require-where-in-delete@2:26");
  process.exitCode = 1;
}
