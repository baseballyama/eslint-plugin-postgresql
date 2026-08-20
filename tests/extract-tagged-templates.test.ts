import { describe, expect, it } from "vitest";
import { extractTaggedTemplates } from "../src/processors/extract-tagged-templates.js";

const SQL_TAGS = new Set(["sql"]);

const textsOf = (code: string) =>
  extractTaggedTemplates(code, SQL_TAGS).map((t) => code.slice(t.start, t.end));

describe("extractTaggedTemplates", () => {
  it("finds a tagged template and reports the span between the backticks", () => {
    const code = "const q = sql`SELECT 1`;";
    const [template] = extractTaggedTemplates(code, SQL_TAGS);
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

  it("matches every tag it is given", () => {
    const code = "prisma.$queryRaw`SELECT 1`; tx.$executeRaw`DELETE FROM t`;";
    const tags = new Set(["$queryRaw", "$executeRaw"]);
    expect(
      extractTaggedTemplates(code, tags).map((t) => code.slice(t.start, t.end)),
    ).toEqual(["SELECT 1", "DELETE FROM t"]);
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
    const [template] = extractTaggedTemplates(code, SQL_TAGS);
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
