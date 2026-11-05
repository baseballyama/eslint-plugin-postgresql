import { Linter } from "eslint";
import postgresqlParser from "postgresql-eslint-parser";
import { expect, it } from "vitest";
import rule from "../src/rules/require-trailing-semicolon.js";
import { runRuleTest } from "./test-utils.js";

runRuleTest(
  "require-trailing-semicolon",
  rule,
  "Require a trailing semicolon at the end of every statement",
);

it("still checks a .sql file that a processor hands back as a block", () => {
  // Only SQL carved out of a non-SQL file (a `sql` template) is skipped.
  const config: Linter.Config[] = [
    {
      files: ["**/*.sql"],
      processor: {
        preprocess: (text: string) => [{ text, filename: "0.sql" }],
        postprocess: (messages: Linter.LintMessage[][]) => messages.flat(),
      },
    },
    {
      files: ["**/*.sql"],
      plugins: {
        postgresql: { rules: { "require-trailing-semicolon": rule } },
      },
      languageOptions: { parser: postgresqlParser },
      rules: { "postgresql/require-trailing-semicolon": "error" },
    },
  ];
  const messages = new Linter({ configType: "flat" }).verify(
    "SELECT 1",
    config,
    { filename: "a.sql", filterCodeBlock: () => true },
  );
  expect(
    messages.map(({ ruleId, line, column }) => ({ ruleId, line, column })),
  ).toEqual([
    { ruleId: "postgresql/require-trailing-semicolon", line: 1, column: 8 },
  ]);
});
