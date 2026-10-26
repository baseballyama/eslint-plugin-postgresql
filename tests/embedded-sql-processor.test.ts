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
      // The DELETE statement starts at column 26, right after the backtick.
      { ruleId: "postgresql/require-where-in-delete", line: 2, column: 26 },
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

  it("ignores ALTER TABLE sub-commands that start with a statement keyword", () => {
    const code = [
      "const a = sql`DROP COLUMN ${sql(column)}`;",
      "const b = sql`DROP CONSTRAINT IF EXISTS ${sql(name)}`;",
      "const c = sql`ALTER COLUMN ${sql(column)} TYPE text`;",
      "const d = sql`ALTER CONSTRAINT ${sql(name)} DEFERRABLE`;",
      "const e = sql`SET DEFAULT 0`;",
      "const f = sql`DROP DEFAULT`;",
      "const g = sql`DROP EXPRESSION IF EXISTS`;",
      "const h = sql`DROP IDENTITY IF EXISTS`;",
      "const i = sql`SET NOT NULL`;",
      "const j = sql`DROP NOT NULL`;",
      "const k = sql`ALTER TABLE users ALTER COLUMN name ${nullable ? sql`DROP` : sql`SET`} NOT NULL`;",
    ].join("\n");
    expect(lintSql(code, { "postgresql/no-syntax-error": "error" })).toEqual(
      [],
    );
  });

  it("still lints statements that start with a sub-command's keyword", () => {
    // A bare keyword is a fragment only at the end of the template; here a
    // quoted parameter name follows SET. A parameter whose name only starts
    // with NOT or DEFAULT is not a sub-command either.
    const code = [
      "await sql`DROP TABLE users`;",
      "await sql`ALTER TABLE users DROP COLUMN name`;",
      'await sql`SET "app.user_id" = ${id}`;',
      "await sql`SET default2.mode = 'on'`;",
    ].join("\n");
    const blocks = processor.preprocess?.(code, "db.ts") ?? [];
    processor.postprocess?.([[], [], [], [], []], "db.ts");
    expect(blocks).toHaveLength(5);
  });

  it("lints a statement that carries interpolations", () => {
    const code = "const q = sql`SELECT * FROM users WHERE id = ${id}`;";
    expect(
      positionsOf(lintSql(code, { "postgresql/no-select-star": "error" })),
    ).toEqual([{ ruleId: "postgresql/no-select-star", line: 1, column: 22 }]);
  });

  it("lints a statement whose interpolation expands to a list", () => {
    // postgres.js expands `sql(ids)` to `($1, $2, ...)`, so a bare
    // identifier in its place would not parse.
    const code = [
      "const a = sql`SELECT * FROM users WHERE id IN ${sql(ids)}`;",
      "const b = sql`SELECT * FROM (VALUES ${sql(rows)}) AS v (id, name)`;",
    ].join("\n");
    expect(
      positionsOf(lintSql(code, { "postgresql/no-select-star": "error" })),
    ).toEqual([
      { ruleId: "postgresql/no-select-star", line: 1, column: 22 },
      { ruleId: "postgresql/no-select-star", line: 2, column: 22 },
    ]);
  });

  it("lints INSERT and UPDATE statements that take a row helper", () => {
    // postgres.js expands `sql(user, "name")` to `("name") values ($1)` after
    // INSERT INTO and to `"name" = $1` after SET.
    const code = [
      'await sql`INSERT INTO "users" ${sql(user, "name")}`;',
      'await sql`UPDATE users SET ${sql(user, "name")}`;',
    ].join("\n");
    expect(
      positionsOf(
        lintSql(code, {
          "postgresql/no-unnecessary-quoted-identifier": "error",
          "postgresql/require-where-in-update": "error",
        }),
      ),
    ).toEqual([
      {
        ruleId: "postgresql/no-unnecessary-quoted-identifier",
        line: 1,
        column: 23,
      },
      { ruleId: "postgresql/require-where-in-update", line: 2, column: 11 },
    ]);
  });

  it("keeps a bare placeholder for a single SET target", () => {
    const code = "const q = sql`UPDATE users SET ${column} = ${value}`;";
    expect(
      positionsOf(
        lintSql(code, { "postgresql/require-where-in-update": "error" }),
      ),
    ).toEqual([
      { ruleId: "postgresql/require-where-in-update", line: 1, column: 15 },
    ]);

    // One SQL block plus the host file: `SET name TO value` still parses.
    const setCommand = "const q = sql`SET ${sql(parameter)} TO DEFAULT`;";
    const blocks = processor.preprocess?.(setCommand, "db.ts") ?? [];
    processor.postprocess?.([[], []], "db.ts");
    expect(blocks).toHaveLength(2);
  });

  it("keeps a bare placeholder where a list shape does not fit", () => {
    // `(_p0)` is wider than `${s}`; `_p0_` still parses after POSITION's IN.
    const code =
      "const q = sql`SELECT * FROM t WHERE POSITION('a' IN ${s}) > 0`;";
    expect(
      positionsOf(lintSql(code, { "postgresql/no-select-star": "error" })),
    ).toEqual([{ ruleId: "postgresql/no-select-star", line: 1, column: 22 }]);
  });

  it("keeps a bare placeholder inside the column list of an INSERT", () => {
    // `users(` is not a table name followed by rows, so `${sql(columns)}`
    // stays a column name and the statement still parses.
    const code =
      'await sql`INSERT INTO users(${sql(columns)}, "name") VALUES (1, 2)`;';
    expect(
      positionsOf(
        lintSql(code, {
          "postgresql/no-unnecessary-quoted-identifier": "error",
        }),
      ),
    ).toEqual([
      {
        ruleId: "postgresql/no-unnecessary-quoted-identifier",
        line: 1,
        column: 46,
      },
    ]);
  });

  it("maps positions after an interpolation that spans several lines", () => {
    const code = [
      "const q = sql`SELECT ${columns({",
      "  id: true,",
      "})}, *",
      "FROM (SELECT * FROM users) AS u`;",
    ].join("\n");
    expect(
      positionsOf(lintSql(code, { "postgresql/no-select-star": "error" })),
    ).toEqual([
      { ruleId: "postgresql/no-select-star", line: 3, column: 6 },
      { ruleId: "postgresql/no-select-star", line: 4, column: 14 },
    ]);
  });

  it("maps positions across every line break ESLint counts", () => {
    // A lone `\r` inside the SQL and a U+2028 before the template each start
    // a new line for ESLint and for the parser.
    const code =
      "// a\u2028b\nconst q = sql`SELECT ${columns({\r\n})}, 1,\r *\nFROM users`;";
    expect(
      positionsOf(lintSql(code, { "postgresql/no-select-star": "error" })),
    ).toEqual([{ ruleId: "postgresql/no-select-star", line: 5, column: 2 }]);
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

  it("stays silent when the parse fails just after an interpolation", () => {
    // Each placeholder is accepted as a name, so the parse fails right after
    // it, on the reserved word that starts the next clause or at the end of
    // the statement: the `${...}` held a clause.
    const code = [
      "const a = sql`WITH ${ctes} SELECT * FROM recent`;",
      "const b = sql`SELECT * FROM orders JOIN users ${joinCondition}`;",
      "const c = sql`SELECT * FROM orders JOIN users ${joinCondition};`;",
      "const d = sql`SELECT * FROM orders JOIN users ${joinCondition} -- why`;",
    ].join("\n");
    expect(lintSql(code, { "postgresql/no-syntax-error": "error" })).toEqual(
      [],
    );
  });

  it("lints the rest of a template that fails to parse on an interpolation", () => {
    // Rules that read tokens still run without a parse; only the syntax
    // error the placeholder caused is withheld.
    const code = [
      "const a = sql`WITH ${ctes} SELECT * FROM recent WHERE id != 1`;",
      "const b = sql`SELECT * FROM orders JOIN users ${on} WHERE id != 1`;",
    ].join("\n");
    expect(
      positionsOf(
        lintSql(code, {
          "postgresql/no-syntax-error": "error",
          "postgresql/prefer-not-equals-operator": "error",
        }),
      ),
    ).toEqual([
      { ruleId: "postgresql/prefer-not-equals-operator", line: 1, column: 58 },
      { ruleId: "postgresql/prefer-not-equals-operator", line: 2, column: 62 },
    ]);
  });

  it("withholds the placeholder's syntax error under any plugin name", () => {
    // Flat config lets users register the plugin as something other than
    // `postgresql`, and the rule id carries that name.
    const code = "const q = sql`WITH ${ctes} SELECT * FROM recent`;";
    const messages = new Linter({ configType: "flat" }).verify(
      code,
      [
        { files: ["**/*.ts"], processor },
        {
          files: ["**/*.sql"],
          plugins: { pg: plugin },
          languageOptions: { parser: postgresqlParser },
          rules: { "pg/no-syntax-error": "error" },
        },
      ],
      {
        filename: "db.ts",
        filterCodeBlock: (blockFilename) => blockFilename.endsWith(".sql"),
      },
    );
    expect(messages).toEqual([]);
  });

  it("reports a syntax error the author made in an interpolated template", () => {
    // The parse fails away from `${id}`, or right after it on something that
    // cannot start a clause, so the mistake is in the author's SQL.
    const code = [
      "const a = sql`SELECT id,, name FROM users WHERE id = ${id}`;",
      "const b = sql`SELECT id FROM users WHERE id = ${id} ORDER BYY id`;",
      "const c = sql`SELECT id FROM users WHERE id = ${id} ANDD active`;",
      "const d = sql`SELECT id FROM users WHERE id = ${id},, active`;",
    ].join("\n");
    expect(
      positionsOf(lintSql(code, { "postgresql/no-syntax-error": "error" })),
    ).toEqual([
      { ruleId: "postgresql/no-syntax-error", line: 1, column: 15 },
      { ruleId: "postgresql/no-syntax-error", line: 2, column: 15 },
      { ruleId: "postgresql/no-syntax-error", line: 3, column: 15 },
      { ruleId: "postgresql/no-syntax-error", line: 4, column: 15 },
    ]);
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

  it("hands the host file back as a bare string, not a named block", () => {
    const code = "const q = sql`SELECT id FROM users`;";
    const blocks = processor.preprocess?.(code, "db.ts") ?? [];
    processor.postprocess?.([[], []], "db.ts");

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({
      text: "SELECT id FROM users",
      filename: "0.sql",
    });
    // A named block would be linted under a synthetic path like `db.ts/1.ts`,
    // which type-aware setups cannot find in the TypeScript program — every
    // file would fail with "was not found by the project service". ESLint
    // lints a string block with the original filename instead.
    expect(blocks[1]).toBe(code);
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
