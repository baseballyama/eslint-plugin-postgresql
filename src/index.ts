import type { ESLint, Linter } from "eslint";
import postgresqlParser from "postgresql-eslint-parser";
import { name, version } from "./meta.js";
import noSyntaxError from "./rules/no-syntax-error.js";

const plugin: ESLint.Plugin = {
  meta: {
    name,
    version,
  },
  rules: {
    "no-syntax-error": noSyntaxError,
  },
  configs: {
    recommended: {
      files: ["**/*.sql"],
      languageOptions: {
        parser: postgresqlParser,
      },
      rules: {
        "postgresql/no-syntax-error": "error",
      },
    } satisfies Linter.Config,
  },
};

export default plugin;
