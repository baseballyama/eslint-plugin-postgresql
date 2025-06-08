import { RuleTester } from "eslint";
import { describe, it } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import postgresqlParser from "postgresql-eslint-parser";
import rule from "../src/rules/no-syntax-error.js";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: postgresqlParser,
  },
});

const readFixtureFiles = (
  folderPath: string,
): Array<{ code: string; filename: string }> => {
  const files = readdirSync(folderPath);
  return files
    .filter((file) => file.endsWith(".sql"))
    .map((file) => ({
      code: readFileSync(join(folderPath, file), "utf-8").trim(),
      filename: file,
    }));
};

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

describe("no-syntax-error", () => {
  it("should validate PostgreSQL syntax in SQL files", () => {
    const validFixtures = readFixtureFiles(
      join(__dirname, "fixtures/no-syntax-error/valid"),
    );
    const invalidFixtures = readInvalidFixtures(
      join(__dirname, "fixtures/no-syntax-error/invalid"),
    );

    ruleTester.run("no-syntax-error", rule, {
      valid: validFixtures,
      invalid: invalidFixtures,
    });
  });
});
