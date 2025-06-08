import type { ESLint, Linter } from "eslint";
import postgresqlParser from "postgresql-eslint-parser";
import { name, version } from "./meta.js";
import noSyntaxError from "./rules/no-syntax-error.js";
import requireLimit from "./rules/require-limit.js";

const plugin: ESLint.Plugin = {
  meta: {
    name,
    version,
  },
  rules: {
    "no-syntax-error": noSyntaxError,
    "require-limit": requireLimit,
  },
  configs: {
    recommended: {
      files: ["**/*.sql"],
      languageOptions: {
        parser: postgresqlParser,
      },
      rules: {
        "postgresql/no-syntax-error": "error",
        "postgresql/require-limit": "warn",
      },
    } satisfies Linter.Config,
  },
};

export default plugin;
