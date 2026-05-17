import { Linter, type Rule } from "eslint";
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { parse, stringify } from "yaml";
import postgresqlParser from "postgresql-eslint-parser";

const UPDATE_FIXTURES = process.env["UPDATE_FIXTURES"] === "true";

type ExpectedError = {
  messageId: string;
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
};

type FixtureMeta = {
  options?: unknown[];
  errors?: ExpectedError[];
  output?: string | null;
};

const flatConfigFor = (
  rule: Rule.RuleModule,
  ruleName: string,
  options: unknown[] | undefined,
) => ({
  languageOptions: {
    parser: postgresqlParser as unknown as Linter.Parser,
  },
  plugins: { test: { rules: { [ruleName]: rule } } },
  rules: {
    [`test/${ruleName}`]: ["error", ...(options ?? [])] as Linter.RuleEntry,
  },
});

const newLinter = () => new Linter({ configType: "flat" });

const lintOnce = (
  rule: Rule.RuleModule,
  ruleName: string,
  code: string,
  options: unknown[] | undefined,
) => newLinter().verify(code, flatConfigFor(rule, ruleName, options));

const lintAndFix = (
  rule: Rule.RuleModule,
  ruleName: string,
  code: string,
  options: unknown[] | undefined,
) => newLinter().verifyAndFix(code, flatConfigFor(rule, ruleName, options));

const yamlPathFor = (folderPath: string, baseName: string) =>
  join(folderPath, `${baseName}.yaml`);

const readYamlMeta = (
  folderPath: string,
  baseName: string,
): FixtureMeta | undefined => {
  const path = yamlPathFor(folderPath, baseName);
  if (!existsSync(path)) return undefined;
  const parsed = parse(readFileSync(path, "utf-8"));
  return (parsed ?? {}) as FixtureMeta;
};

const readSql = (folderPath: string, file: string) =>
  readFileSync(join(folderPath, file), "utf-8").replace(/\r\n/g, "\n");

const sqlFilesIn = (folderPath: string) =>
  readdirSync(folderPath)
    .filter((f) => f.endsWith(".sql"))
    .sort();

const writeYaml = (folderPath: string, baseName: string, meta: FixtureMeta) => {
  const ordered: Record<string, unknown> = {};
  if (meta.options !== undefined) ordered["options"] = meta.options;
  if (meta.errors !== undefined) ordered["errors"] = meta.errors;
  if (meta.output !== undefined) ordered["output"] = meta.output;
  writeFileSync(
    yamlPathFor(folderPath, baseName),
    stringify(ordered, { lineWidth: 0, blockQuote: "literal" }),
  );
};

const messageToExpected = (m: Linter.LintMessage): ExpectedError => ({
  messageId: m.messageId ?? "",
  message: m.message,
  line: m.line,
  column: m.column,
  ...(m.endLine !== undefined ? { endLine: m.endLine } : {}),
  ...(m.endColumn !== undefined ? { endColumn: m.endColumn } : {}),
});

const buildFixtureMetaFromLint = (
  rule: Rule.RuleModule,
  ruleName: string,
  code: string,
  options: unknown[] | undefined,
): FixtureMeta => {
  const messages = lintOnce(rule, ruleName, code, options);
  if (messages.some((m) => m.fatal)) {
    throw new Error(
      `Fatal error while building fixture for ${ruleName}: ${messages
        .filter((m) => m.fatal)
        .map((m) => m.message)
        .join("; ")}`,
    );
  }
  const errors = messages.map(messageToExpected);
  const fixable =
    rule.meta?.fixable !== undefined && rule.meta?.fixable !== null;
  let output: string | null = null;
  if (fixable) {
    const fixed = lintAndFix(rule, ruleName, code, options);
    if (fixed.fixed && fixed.output !== code) {
      output = fixed.output.replace(/\r\n/g, "\n");
    }
  }
  const meta: FixtureMeta = { errors, output };
  if (options !== undefined) meta.options = options;
  return meta;
};

const assertInvalidFixture = (
  rule: Rule.RuleModule,
  ruleName: string,
  filename: string,
  code: string,
  expected: ExpectedError[],
  expectedOutput: string | null | undefined,
  options: unknown[] | undefined,
) => {
  const actual = lintOnce(rule, ruleName, code, options);
  expect(
    actual.map(messageToExpected),
    `[${ruleName}/${filename}] reported errors should match fixture`,
  ).toEqual(expected);

  const fixable =
    rule.meta?.fixable !== undefined && rule.meta?.fixable !== null;
  if (fixable) {
    const fixed = lintAndFix(rule, ruleName, code, options);
    const actualOutput = fixed.fixed ? fixed.output : null;
    if (expectedOutput === undefined) return;
    expect(
      actualOutput,
      `[${ruleName}/${filename}] fixed output should match fixture`,
    ).toBe(expectedOutput);
  } else if (expectedOutput) {
    throw new Error(
      `[${ruleName}/${filename}] fixture declares output but rule is not fixable`,
    );
  }
};

const assertValidFixture = (
  rule: Rule.RuleModule,
  ruleName: string,
  filename: string,
  code: string,
  options: unknown[] | undefined,
) => {
  const actual = lintOnce(rule, ruleName, code, options);
  expect(
    actual.map(messageToExpected),
    `[${ruleName}/${filename}] valid fixture should produce no errors`,
  ).toEqual([]);
};

export const runRuleTest = (
  ruleName: string,
  rule: Rule.RuleModule,
  testDescription: string,
) => {
  describe(`${ruleName} — ${testDescription}`, () => {
    const validDir = join(__dirname, `fixtures/${ruleName}/valid`);
    const invalidDir = join(__dirname, `fixtures/${ruleName}/invalid`);

    if (existsSync(validDir)) {
      describe("valid", () => {
        for (const file of sqlFilesIn(validDir)) {
          const baseName = file.slice(0, -".sql".length);
          it(file, () => {
            const code = readSql(validDir, file).trim();
            const meta = readYamlMeta(validDir, baseName);
            assertValidFixture(rule, ruleName, file, code, meta?.options);
          });
        }
      });
    }

    if (existsSync(invalidDir)) {
      describe("invalid", () => {
        for (const file of sqlFilesIn(invalidDir)) {
          const baseName = file.slice(0, -".sql".length);
          it(file, () => {
            const code = readSql(invalidDir, file).trim();
            let meta = readYamlMeta(invalidDir, baseName);
            if (
              UPDATE_FIXTURES ||
              meta === undefined ||
              meta.errors === undefined
            ) {
              meta = buildFixtureMetaFromLint(
                rule,
                ruleName,
                code,
                meta?.options,
              );
              writeYaml(invalidDir, baseName, meta);
            }
            assertInvalidFixture(
              rule,
              ruleName,
              file,
              code,
              meta.errors ?? [],
              meta.output,
              meta.options,
            );
          });
        }
      });
    }
  });
};
