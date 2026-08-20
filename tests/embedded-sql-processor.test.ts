import { Linter } from "eslint";
import postgresqlParser from "postgresql-eslint-parser";
import { describe, expect, it } from "vitest";
import plugin from "../src/index.js";

const processor = plugin.processors?.["embedded-sql"];
if (processor === undefined) {
  throw new Error("the embedded-sql processor is not registered on the plugin");
}

const configFor = (rules: Linter.RulesRecord): Linter.Config[] => [
  {
    files: ["**/*.ts"],
    processor,
  },
  {
    files: ["**/*.sql"],
    plugins: { postgresql: plugin },
    languageOptions: { parser: postgresqlParser },
    rules,
  },
];

/** Lints only the extracted SQL, the way a rule-focused fixture would. */
const lintSql = (code: string, rules: Linter.RulesRecord) =>
  new Linter({ configType: "flat" }).verify(code, configFor(rules), {
    filename: "db.ts",
    filterCodeBlock: (blockFilename) => blockFilename.endsWith(".sql"),
  });

const fixSql = (code: string, rules: Linter.RulesRecord) =>
  new Linter({ configType: "flat" }).verifyAndFix(code, configFor(rules), {
    filename: "db.ts",
    filterCodeBlock: (blockFilename) => blockFilename.endsWith(".sql"),
  });

const positionsOf = (messages: Linter.LintMessage[]) =>
  messages.map((m) => ({
    ruleId: m.ruleId,
    line: m.line,
    column: m.column,
  }));

describe("processors/embedded-sql", () => {
  it("reports a statement at its position in the host file", () => {
    const code = ["const q = sql`SELECT * FROM users`;"].join("\n");
    expect(
      positionsOf(lintSql(code, { "postgresql/no-select-star": "error" })),
    ).toEqual([{ ruleId: "postgresql/no-select-star", line: 1, column: 22 }]);
    // Column 22 is the `*`, counted from the start of the host file line.
    expect(code[21]).toBe("*");
  });

  it("lints Prisma's raw-query tags", () => {
    const code = [
      "const rows = await prisma.$queryRaw`SELECT * FROM users`;",
      "await prisma.$executeRaw`DELETE FROM sessions`;",
    ].join("\n");
    expect(
      positionsOf(
        lintSql(code, {
          "postgresql/no-select-star": "error",
          "postgresql/require-where-in-delete": "error",
        }),
      ),
    ).toEqual([
      { ruleId: "postgresql/no-select-star", line: 1, column: 44 },
      { ruleId: "postgresql/require-where-in-delete", line: 2, column: 38 },
    ]);
  });

  it("maps positions on later lines of a multi-line template", () => {
    const code = [
      "await db.execute(sql`",
      "  SELECT *",
      "  FROM users",
      "`);",
    ].join("\n");
    expect(
      positionsOf(lintSql(code, { "postgresql/no-select-star": "error" })),
    ).toEqual([{ ruleId: "postgresql/no-select-star", line: 2, column: 10 }]);
  });

  it("ignores expression fragments that are not complete statements", () => {
    const code = [
      "const a = sql`excluded.cognito_user_sub`;",
      "const b = sql`${users.userName} IS NULL`;",
      "const c = sql`current_timestamp(3)`;",
    ].join("\n");
    expect(lintSql(code, { "postgresql/no-syntax-error": "error" })).toEqual(
      [],
    );
  });

  it("lints a statement that carries interpolations", () => {
    const code = "const q = sql`SELECT * FROM users WHERE id = ${id}`;";
    expect(
      positionsOf(lintSql(code, { "postgresql/no-select-star": "error" })),
    ).toEqual([{ ruleId: "postgresql/no-select-star", line: 1, column: 22 }]);
  });

  it("reports a genuine syntax error in a template without interpolations", () => {
    const code = "const q = sql`SELECT FROM WHERE`;";
    const messages = lintSql(code, { "postgresql/no-syntax-error": "error" });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.ruleId).toBe("postgresql/no-syntax-error");
    expect(messages[0]?.line).toBe(1);
  });

  it("stays silent when an interpolated template fails to parse", () => {
    // `${dir}` becomes an identifier, which is not valid after ORDER BY —
    // a failure our substitution caused, not one the author can act on.
    const code = "const q = sql`SELECT id FROM t ORDER BY name ${dir}`;";
    expect(lintSql(code, { "postgresql/no-syntax-error": "error" })).toEqual(
      [],
    );
  });

  it("does not report on the placeholder that stands in for an interpolation", () => {
    // The expression is longer than PostgreSQL's identifier limit, so the
    // placeholder would trip no-identifier-too-long if it were reported on.
    const expression = "organizationId == null && userId == null ? 'a' : 'b'";
    const code = `const q = sql\`SELECT * FROM t WHERE flag = \${${expression}}\`;`;
    expect(
      lintSql(code, { "postgresql/no-identifier-too-long": "error" }),
    ).toEqual([]);
  });

  it("skips templates whose raw text differs from the string that runs", () => {
    // `'\\'` is two characters in the file but one in the value drizzle sends.
    const code =
      "const q = sql`SELECT * FROM t WHERE a LIKE 'x' ESCAPE '\\\\'`;";
    expect(lintSql(code, { "postgresql/no-select-star": "error" })).toEqual([]);
  });

  it("lints the host file alongside the extracted SQL", () => {
    const code = [
      "const unused = 1;",
      "export const q = sql`SELECT * FROM users`;",
    ].join("\n");
    const messages = new Linter({ configType: "flat" }).verify(
      code,
      [
        ...configFor({ "postgresql/no-select-star": "error" }),
        {
          files: ["**/*.ts"],
          languageOptions: { ecmaVersion: 2022, sourceType: "module" },
          rules: { "no-unused-vars": "error" },
        },
      ],
      { filename: "db.ts", filterCodeBlock: () => true },
    );
    expect(messages.map((m) => m.ruleId).sort()).toEqual([
      "no-unused-vars",
      "postgresql/no-select-star",
    ]);
  });

  it("applies a fix inside the template without disturbing the host file", () => {
    const code = "const q = sql`SELECT * FROM t WHERE a != 1`;";
    const result = fixSql(code, {
      "postgresql/prefer-not-equals-operator": "error",
    });
    expect(result.fixed).toBe(true);
    expect(result.output).toBe("const q = sql`SELECT * FROM t WHERE a <> 1`;");
  });

  it("drops a fix that would rewrite an interpolation", () => {
    const code = "const q = sql`SELECT CAST(${v} AS int) FROM t`;";
    const result = fixSql(code, { "postgresql/prefer-cast-operator": "error" });
    expect(result.fixed).toBe(false);
    expect(result.output).toBe(code);
    expect(result.messages.map((m) => m.ruleId)).toEqual([
      "postgresql/prefer-cast-operator",
    ]);
  });
});
