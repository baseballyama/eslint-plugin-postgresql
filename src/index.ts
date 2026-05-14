import type { ESLint, Linter } from "eslint";
import postgresqlParser from "postgresql-eslint-parser";
import { name, version } from "./meta.js";
import noCharType from "./rules/no-char-type.js";
import noCrossJoin from "./rules/no-cross-join.js";
import noDistinctOnWithoutOrderBy from "./rules/no-distinct-on-without-order-by.js";
import noDropTableCascade from "./rules/no-drop-table-cascade.js";
import noGrantToPublic from "./rules/no-grant-to-public.js";
import noGroupByOrdinal from "./rules/no-group-by-ordinal.js";
import noImplicitJoin from "./rules/no-implicit-join.js";
import noMoneyType from "./rules/no-money-type.js";
import noNaturalJoin from "./rules/no-natural-join.js";
import noNotInSubquery from "./rules/no-not-in-subquery.js";
import noOrderByOrdinal from "./rules/no-order-by-ordinal.js";
import noSelectStar from "./rules/no-select-star.js";
import noSyntaxError from "./rules/no-syntax-error.js";
import noTruncateCascade from "./rules/no-truncate-cascade.js";
import preferCreateIndexConcurrently from "./rules/prefer-create-index-concurrently.js";
import preferIdentityOverSerial from "./rules/prefer-identity-over-serial.js";
import preferJsonbOverJson from "./rules/prefer-jsonb-over-json.js";
import preferTextOverVarchar from "./rules/prefer-text-over-varchar.js";
import preferTimestamptz from "./rules/prefer-timestamptz.js";
import requireLimit from "./rules/require-limit.js";
import requirePrimaryKey from "./rules/require-primary-key.js";
import requireWhereInDelete from "./rules/require-where-in-delete.js";
import requireWhereInUpdate from "./rules/require-where-in-update.js";
import snakeCaseColumnName from "./rules/snake-case-column-name.js";
import snakeCaseTableName from "./rules/snake-case-table-name.js";

const rules = {
  "no-char-type": noCharType,
  "no-cross-join": noCrossJoin,
  "no-distinct-on-without-order-by": noDistinctOnWithoutOrderBy,
  "no-drop-table-cascade": noDropTableCascade,
  "no-grant-to-public": noGrantToPublic,
  "no-group-by-ordinal": noGroupByOrdinal,
  "no-implicit-join": noImplicitJoin,
  "no-money-type": noMoneyType,
  "no-natural-join": noNaturalJoin,
  "no-not-in-subquery": noNotInSubquery,
  "no-order-by-ordinal": noOrderByOrdinal,
  "no-select-star": noSelectStar,
  "no-syntax-error": noSyntaxError,
  "no-truncate-cascade": noTruncateCascade,
  "prefer-create-index-concurrently": preferCreateIndexConcurrently,
  "prefer-identity-over-serial": preferIdentityOverSerial,
  "prefer-jsonb-over-json": preferJsonbOverJson,
  "prefer-text-over-varchar": preferTextOverVarchar,
  "prefer-timestamptz": preferTimestamptz,
  "require-limit": requireLimit,
  "require-primary-key": requirePrimaryKey,
  "require-where-in-delete": requireWhereInDelete,
  "require-where-in-update": requireWhereInUpdate,
  "snake-case-column-name": snakeCaseColumnName,
  "snake-case-table-name": snakeCaseTableName,
};

const plugin: ESLint.Plugin = {
  meta: {
    name,
    version,
  },
  rules,
};

// `configs.recommended` references the plugin object itself in `plugins`, so
// we set it after the plugin is constructed to avoid the circular literal.
// Spreading `...postgresql.configs.recommended` in a flat-config array now
// gives ESLint everything it needs (parser, plugin binding, rule severities)
// without the consumer having to wire the plugin separately.
plugin.configs = {
  recommended: {
    files: ["**/*.sql"],
    plugins: { postgresql: plugin },
    languageOptions: {
      parser: postgresqlParser,
    },
    rules: {
      "postgresql/no-char-type": "warn",
      "postgresql/no-cross-join": "warn",
      "postgresql/no-distinct-on-without-order-by": "error",
      "postgresql/no-drop-table-cascade": "warn",
      "postgresql/no-grant-to-public": "warn",
      "postgresql/no-group-by-ordinal": "warn",
      "postgresql/no-implicit-join": "warn",
      "postgresql/no-money-type": "error",
      "postgresql/no-natural-join": "error",
      "postgresql/no-not-in-subquery": "error",
      "postgresql/no-order-by-ordinal": "warn",
      "postgresql/no-syntax-error": "error",
      "postgresql/no-truncate-cascade": "warn",
      "postgresql/prefer-identity-over-serial": "warn",
      "postgresql/prefer-jsonb-over-json": "warn",
      "postgresql/prefer-text-over-varchar": "warn",
      "postgresql/prefer-timestamptz": "warn",
      "postgresql/require-limit": "warn",
      "postgresql/require-primary-key": "warn",
      "postgresql/require-where-in-delete": "error",
      "postgresql/require-where-in-update": "error",
      "postgresql/snake-case-column-name": "warn",
      "postgresql/snake-case-table-name": "warn",
    },
  } satisfies Linter.Config,
};

export default plugin;
