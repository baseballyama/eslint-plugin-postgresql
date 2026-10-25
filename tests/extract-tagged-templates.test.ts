import { describe, expect, it } from "vitest";
import { extractTaggedTemplates } from "../src/processors/extract-tagged-templates.js";

const isSqlTag = (path: string) => path === "sql" || path.endsWith(".sql");

const textsOf = (code: string, predicate = isSqlTag) =>
  extractTaggedTemplates(code, predicate).map((t) =>
    code.slice(t.start, t.end),
  );

const acceptAll = () => true;

describe("extractTaggedTemplates", () => {
  it("finds a tagged template and reports the span between the backticks", () => {
    const code = "const q = sql`SELECT 1`;";
    const [template] = extractTaggedTemplates(code, isSqlTag);
    expect(template).toBeDefined();
    expect(code.slice(template!.start, template!.end)).toBe("SELECT 1");
    expect(template!.interpolations).toEqual([]);
  });

  it("ignores templates carrying a different tag or no tag at all", () => {
    expect(textsOf("const a = gql`SELECT 1`; const b = `SELECT 2`;")).toEqual(
      [],
    );
  });

  it("accepts a member-expression tag", () => {
    expect(textsOf("db.sql`SELECT 1`")).toEqual(["SELECT 1"]);
  });

  it("skips type arguments between the tag and the backtick", () => {
    const code = [
      "sql<number>`SELECT 1`;",
      "sql<Array<Row>>`SELECT 2`;",
      "sql<Pick<Row, `id` | `name`>[]>`SELECT 3`;",
      "sql<{ id: number; onRow: () => void }>`SELECT 4`;",
    ].join("\n");
    expect(textsOf(code)).toEqual([
      "SELECT 1",
      "SELECT 2",
      "SELECT 3",
      "SELECT 4",
    ]);
  });

  it("does not mistake a less-than after a tag for type arguments", () => {
    const code = [
      "if (sql < max) log();",
      "const f = () => `SELECT 1`;",
      "sql<Row>`SELECT 2`;",
    ].join("\n");
    expect(textsOf(code)).toEqual(["SELECT 2"]);
  });

  it("does not mistake a less-than for type arguments when any path is a tag", () => {
    const code = [
      "if (a < b) log();",
      "const small = a < b;",
      "const f = () => `SELECT 1`;",
      "pg<Row>`SELECT 2`;",
    ].join("\n");
    expect(textsOf(code, acceptAll)).toEqual(["SELECT 2"]);
  });

  it("skips nested type arguments when any path is a tag", () => {
    const code = "pg<Pick<Row<`users`>, `id` | `name`>[]>`SELECT 1`;";
    expect(textsOf(code, acceptAll)).toEqual(["SELECT 1"]);
  });

  it("gives the predicate each tag's member path, without call or type arguments", () => {
    const code = [
      "prisma.$queryRaw`SELECT 1`;",
      "sql<Row[]>`SELECT 2`;",
      "sql.type(schema)`SELECT 3`;",
      "this.db.sql`SELECT 4`;",
      "getDb().sql`SELECT 5`;",
      "keyBy(cols.map((col) => `${col}_id`))<Row>`SELECT 6`;",
      "where(a < b)`SELECT 7`;",
      "const untagged = `SELECT 8`;",
    ].join("\n");
    const paths: string[] = [];
    extractTaggedTemplates(code, (path) => {
      paths.push(path);
      return true;
    });
    expect(paths).toEqual([
      "prisma.$queryRaw",
      "sql",
      "sql.type",
      "this.db.sql",
      "getDb.sql",
      "keyBy",
      "where",
    ]);
  });

  it("does not take a keyword for a tag", () => {
    const code = [
      "function f() { return `SELECT 1`; }",
      "switch (q) { case `SELECT 2`: break; }",
      "const q = sql`SELECT 3`;",
    ].join("\n");
    expect(textsOf(code, acceptAll)).toEqual(["SELECT 3"]);
  });

  it("does not mistake backticks inside strings or comments for templates", () => {
    const code = [
      "const a = 'sql`SELECT 1`';",
      'const b = "sql`SELECT 2`";',
      "// sql`SELECT 3`",
      "/* sql`SELECT 4` */",
      "const c = sql`SELECT 5`;",
    ].join("\n");
    expect(textsOf(code)).toEqual(["SELECT 5"]);
  });

  it("does not mistake backticks inside a regular expression for templates", () => {
    const code = "const re = /sql`SELECT 1`/; const q = sql`SELECT 2`;";
    expect(textsOf(code)).toEqual(["SELECT 2"]);
  });

  it("treats a slash after a keyword as a regular expression, not division", () => {
    // Without the keyword table, the `'` in the character class would open a
    // string and swallow the template that follows.
    const code = "function f() { return /['\"]/g; }\nconst q = sql`SELECT 1`;";
    expect(textsOf(code)).toEqual(["SELECT 1"]);
  });

  it("treats a slash after a value as division", () => {
    const code = "const r = total / count; const q = sql`SELECT 1`;";
    expect(textsOf(code)).toEqual(["SELECT 1"]);
  });

  it("records interpolation spans, including nested braces", () => {
    const code = "sql`SELECT ${{ a: 1 }.a} FROM t WHERE x = ${id}`";
    const [template] = extractTaggedTemplates(code, isSqlTag);
    expect(template).toBeDefined();
    expect(template!.interpolations.map(([s, e]) => code.slice(s, e))).toEqual([
      "${{ a: 1 }.a}",
      "${id}",
    ]);
  });

  it("handles a template nested inside an interpolation", () => {
    const code = "sql`SELECT ${sql`1`} FROM t`";
    expect(textsOf(code)).toEqual(["SELECT ${sql`1`} FROM t", "1"]);
  });

  it("keeps scanning after an escaped backtick", () => {
    const code = "const a = `\\``; const q = sql`SELECT 1`;";
    expect(textsOf(code)).toEqual(["SELECT 1"]);
  });

  it("returns templates in source order", () => {
    const code = "sql`SELECT 1`; sql`SELECT ${sql`2`} FROM t`;";
    expect(textsOf(code)).toEqual(["SELECT 1", "SELECT ${sql`2`} FROM t", "2"]);
  });
});
