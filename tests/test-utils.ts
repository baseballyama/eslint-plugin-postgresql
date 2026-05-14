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

const readOptionsFor = (
  folderPath: string,
  baseName: string,
): unknown[] | undefined => {
  try {
    return JSON.parse(
      readFileSync(join(folderPath, `${baseName}-options.json`), "utf-8"),
    );
  } catch {
    return undefined;
  }
};

// Fixtureファイルを読み込む共通関数
const readFixtureFiles = (
  folderPath: string,
): Array<{ code: string; filename: string; options?: unknown[] }> => {
  const files = readdirSync(folderPath);
  return files
    .filter((file) => file.endsWith(".sql"))
    .map((file) => {
      const baseName = file.replace(".sql", "");
      const options = readOptionsFor(folderPath, baseName);
      return {
        code: readFileSync(join(folderPath, file), "utf-8").trim(),
        filename: file,
        ...(options !== undefined ? { options } : {}),
      };
    });
};

// Invalid fixtureを読み込む共通関数
const readInvalidFixtures = (folderPath: string) => {
  const files = readdirSync(folderPath);
  const sqlFiles = files.filter(
    (file) => file.endsWith(".sql") && !file.endsWith(".expected.sql"),
  );

  return sqlFiles.map((file) => {
    const baseName = file.replace(".sql", "");
    const expectedErrorsFile = `${baseName}-errors.expected.json`;
    const expectedErrorsPath = join(folderPath, expectedErrorsFile);

    const expectedErrors = readFileSync(expectedErrorsPath, "utf-8");
    const errors = JSON.parse(expectedErrors);

    const expectedOutputFile = `${baseName}-output.expected.sql`;
    const expectedOutputPath = join(folderPath, expectedOutputFile);
    let output: string | undefined;
    try {
      output = readFileSync(expectedOutputPath, "utf-8").trim();
    } catch {
      output = undefined;
    }

    const options = readOptionsFor(folderPath, baseName);

    return {
      code: readFileSync(join(folderPath, file), "utf-8").trim(),
      filename: file,
      errors,
      ...(output !== undefined ? { output } : {}),
      ...(options !== undefined ? { options } : {}),
    };
  });
};

// ルールテストを実行する共通関数
export const runRuleTest = (
  ruleName: string,
  rule: any,
  testDescription: string,
) => {
  describe(ruleName, () => {
    it(testDescription, () => {
      const ruleTester = createRuleTester();
      const validFixtures = readFixtureFiles(
        join(__dirname, `fixtures/${ruleName}/valid`),
      );
      const invalidFixtures = readInvalidFixtures(
        join(__dirname, `fixtures/${ruleName}/invalid`),
      );

      ruleTester.run(ruleName, rule, {
        valid: validFixtures,
        invalid: invalidFixtures,
      });
    });
  });
};
