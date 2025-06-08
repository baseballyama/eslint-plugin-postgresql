import { RuleTester } from "eslint";
import { describe, it } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import postgresqlParser from "postgresql-eslint-parser";

// 共通のRuleTester設定
const createRuleTester = () => {
  return new RuleTester({
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: postgresqlParser,
    },
  });
};

// Fixtureファイルを読み込む共通関数
const readFixtureFiles = (
  folderPath: string
): Array<{ code: string; filename: string }> => {
  const files = readdirSync(folderPath);
  return files
    .filter((file) => file.endsWith(".sql"))
    .map((file) => ({
      code: readFileSync(join(folderPath, file), "utf-8").trim(),
      filename: file,
    }));
};

// Invalid fixtureを読み込む共通関数
const readInvalidFixtures = (folderPath: string) => {
  const files = readdirSync(folderPath);
  const sqlFiles = files.filter((file) => file.endsWith(".sql"));

  return sqlFiles.map((file) => {
    const baseName = file.replace(".sql", "");
    const expectedErrorsFile = `${baseName}-errors.expected.json`;
    const expectedErrorsPath = join(folderPath, expectedErrorsFile);

    const expectedErrors = readFileSync(expectedErrorsPath, "utf-8");
    const errors = JSON.parse(expectedErrors);

    return {
      code: readFileSync(join(folderPath, file), "utf-8").trim(),
      filename: file,
      errors,
    };
  });
};

// ルールテストを実行する共通関数
export const runRuleTest = (
  ruleName: string,
  rule: any,
  testDescription: string
) => {
  describe(ruleName, () => {
    it(testDescription, () => {
      const ruleTester = createRuleTester();
      const validFixtures = readFixtureFiles(
        join(__dirname, `fixtures/${ruleName}/valid`)
      );
      const invalidFixtures = readInvalidFixtures(
        join(__dirname, `fixtures/${ruleName}/invalid`)
      );

      ruleTester.run(ruleName, rule, {
        valid: validFixtures,
        invalid: invalidFixtures,
      });
    });
  });
};
