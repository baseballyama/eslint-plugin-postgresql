import type { ESLint, Linter } from "eslint";
import postgresqlParser from "postgresql-eslint-parser";
import { name, version } from "./meta.js";
import noSelectStar from "./rules/no-select-star.js";
import noDropTableCascade from "./rules/no-drop-table-cascade.js";
import noCrossJoin from "./rules/no-cross-join.js";
import noSyntaxError from "./rules/no-syntax-error.js";
import noTruncateCascade from "./rules/no-truncate-cascade.js";
import requireLimit from "./rules/require-limit.js";
import requireWhereInDelete from "./rules/require-where-in-delete.js";
import requireWhereInUpdate from "./rules/require-where-in-update.js";

const plugin: ESLint.Plugin = {
  meta: {
    name,
    version,
  },
  rules: {
    "no-select-star": noSelectStar,
    "no-drop-table-cascade": noDropTableCascade,
    "no-cross-join": noCrossJoin,
    "no-syntax-error": noSyntaxError,
    "no-truncate-cascade": noTruncateCascade,
    "require-limit": requireLimit,
    "require-where-in-delete": requireWhereInDelete,
    "require-where-in-update": requireWhereInUpdate,
  },
  configs: {
    recommended: {
      files: ["**/*.sql"],
      languageOptions: {
        parser: postgresqlParser,
      },
      rules: {
        "postgresql/no-drop-table-cascade": "warn",
        "postgresql/no-cross-join": "warn",
        "postgresql/no-syntax-error": "error",
        "postgresql/no-truncate-cascade": "warn",
        "postgresql/require-limit": "warn",
        "postgresql/require-where-in-delete": "error",
        "postgresql/require-where-in-update": "error",
      },
    } satisfies Linter.Config,
  },
};

export default plugin;
