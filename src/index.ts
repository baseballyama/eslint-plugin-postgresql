import type { ESLint, Linter } from "eslint";
import postgresqlParser from "postgresql-eslint-parser";
import { name, version } from "./meta.js";
import noSelectStar from "./rules/no-select-star.js";
import noSyntaxError from "./rules/no-syntax-error.js";
import requireLimit from "./rules/require-limit.js";
import requireWhereInDelete from "./rules/require-where-in-delete.js";

const plugin: ESLint.Plugin = {
  meta: {
    name,
    version,
  },
  rules: {
    "no-select-star": noSelectStar,
    "no-syntax-error": noSyntaxError,
    "require-limit": requireLimit,
    "require-where-in-delete": requireWhereInDelete,
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
        "postgresql/require-where-in-delete": "error",
      },
    } satisfies Linter.Config,
  },
};

export default plugin;
