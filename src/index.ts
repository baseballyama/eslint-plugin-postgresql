import type { ESLint, Linter } from "eslint";
import postgresqlParser from "postgresql-eslint-parser";
import { name, version } from "./meta.js";
import noAddColumnNotNullWithoutDefault from "./rules/no-add-column-not-null-without-default.js";
import noAlterColumnType from "./rules/no-alter-column-type.js";
import noCharType from "./rules/no-char-type.js";
import noCluster from "./rules/no-cluster.js";
import noCreateRole from "./rules/no-create-role.js";
import noCrossJoin from "./rules/no-cross-join.js";
import noDistinctOnWithoutOrderBy from "./rules/no-distinct-on-without-order-by.js";
import noDropColumn from "./rules/no-drop-column.js";
import noDropDatabase from "./rules/no-drop-database.js";
import noDropNotNull from "./rules/no-drop-not-null.js";
import noDropSchemaCascade from "./rules/no-drop-schema-cascade.js";
import noDropTableCascade from "./rules/no-drop-table-cascade.js";
import noGrantToPublic from "./rules/no-grant-to-public.js";
import noGroupByOrdinal from "./rules/no-group-by-ordinal.js";
import noHavingWithoutGroupBy from "./rules/no-having-without-group-by.js";
import noImplicitJoin from "./rules/no-implicit-join.js";
import noLeadingWildcardLike from "./rules/no-leading-wildcard-like.js";
import noMoneyType from "./rules/no-money-type.js";
import noNaturalJoin from "./rules/no-natural-join.js";
import noNotInSubquery from "./rules/no-not-in-subquery.js";
import noNumericWithoutPrecision from "./rules/no-numeric-without-precision.js";
import noOrderByOrdinal from "./rules/no-order-by-ordinal.js";
import noRenameColumn from "./rules/no-rename-column.js";
import noRenameTable from "./rules/no-rename-table.js";
import noSelectInto from "./rules/no-select-into.js";
import noSelectStar from "./rules/no-select-star.js";
import noSetNotNull from "./rules/no-set-not-null.js";
import noSetSearchPath from "./rules/no-set-search-path.js";
import noSyntaxError from "./rules/no-syntax-error.js";
import noTemporaryTable from "./rules/no-temporary-table.js";
import noTimeType from "./rules/no-time-type.js";
import noTruncateCascade from "./rules/no-truncate-cascade.js";
import noUnloggedTable from "./rules/no-unlogged-table.js";
import noVacuumFull from "./rules/no-vacuum-full.js";
import preferBigintId from "./rules/prefer-bigint-id.js";
import preferCoalesceOverCase from "./rules/prefer-coalesce-over-case.js";
import preferCreateIndexConcurrently from "./rules/prefer-create-index-concurrently.js";
import preferExplicitNullOrdering from "./rules/prefer-explicit-null-ordering.js";
import preferFkNotValid from "./rules/prefer-fk-not-valid.js";
import preferIdentityOverSerial from "./rules/prefer-identity-over-serial.js";
import preferJsonbOverJson from "./rules/prefer-jsonb-over-json.js";
import preferReindexConcurrently from "./rules/prefer-reindex-concurrently.js";
import preferTextOverVarchar from "./rules/prefer-text-over-varchar.js";
import preferTimestamptz from "./rules/prefer-timestamptz.js";
import requireLimit from "./rules/require-limit.js";
import requireNamedConstraint from "./rules/require-named-constraint.js";
import requirePrimaryKey from "./rules/require-primary-key.js";
import requireSchemaQualifiedTable from "./rules/require-schema-qualified-table.js";
import requireWhereInDelete from "./rules/require-where-in-delete.js";
import requireWhereInUpdate from "./rules/require-where-in-update.js";
import snakeCaseColumnName from "./rules/snake-case-column-name.js";
import snakeCaseTableName from "./rules/snake-case-table-name.js";

const rules = {
  "no-add-column-not-null-without-default": noAddColumnNotNullWithoutDefault,
  "no-alter-column-type": noAlterColumnType,
  "no-char-type": noCharType,
  "no-cluster": noCluster,
  "no-create-role": noCreateRole,
  "no-cross-join": noCrossJoin,
  "no-distinct-on-without-order-by": noDistinctOnWithoutOrderBy,
  "no-drop-column": noDropColumn,
  "no-drop-database": noDropDatabase,
  "no-drop-not-null": noDropNotNull,
  "no-drop-schema-cascade": noDropSchemaCascade,
  "no-drop-table-cascade": noDropTableCascade,
  "no-grant-to-public": noGrantToPublic,
  "no-group-by-ordinal": noGroupByOrdinal,
  "no-having-without-group-by": noHavingWithoutGroupBy,
  "no-implicit-join": noImplicitJoin,
  "no-leading-wildcard-like": noLeadingWildcardLike,
  "no-money-type": noMoneyType,
  "no-natural-join": noNaturalJoin,
  "no-not-in-subquery": noNotInSubquery,
  "no-numeric-without-precision": noNumericWithoutPrecision,
  "no-order-by-ordinal": noOrderByOrdinal,
  "no-rename-column": noRenameColumn,
  "no-rename-table": noRenameTable,
  "no-select-into": noSelectInto,
  "no-select-star": noSelectStar,
  "no-set-not-null": noSetNotNull,
  "no-set-search-path": noSetSearchPath,
  "no-syntax-error": noSyntaxError,
  "no-temporary-table": noTemporaryTable,
  "no-time-type": noTimeType,
  "no-truncate-cascade": noTruncateCascade,
  "no-unlogged-table": noUnloggedTable,
  "no-vacuum-full": noVacuumFull,
  "prefer-bigint-id": preferBigintId,
  "prefer-coalesce-over-case": preferCoalesceOverCase,
  "prefer-create-index-concurrently": preferCreateIndexConcurrently,
  "prefer-explicit-null-ordering": preferExplicitNullOrdering,
  "prefer-fk-not-valid": preferFkNotValid,
  "prefer-identity-over-serial": preferIdentityOverSerial,
  "prefer-jsonb-over-json": preferJsonbOverJson,
  "prefer-reindex-concurrently": preferReindexConcurrently,
  "prefer-text-over-varchar": preferTextOverVarchar,
  "prefer-timestamptz": preferTimestamptz,
  "require-limit": requireLimit,
  "require-named-constraint": requireNamedConstraint,
  "require-primary-key": requirePrimaryKey,
  "require-schema-qualified-table": requireSchemaQualifiedTable,
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
      "postgresql/no-add-column-not-null-without-default": "error",
      "postgresql/no-alter-column-type": "warn",
      "postgresql/no-char-type": "warn",
      "postgresql/no-cluster": "warn",
      "postgresql/no-create-role": "warn",
      "postgresql/no-cross-join": "warn",
      "postgresql/no-distinct-on-without-order-by": "error",
      "postgresql/no-drop-column": "warn",
      "postgresql/no-drop-database": "error",
      "postgresql/no-drop-not-null": "warn",
      "postgresql/no-drop-schema-cascade": "warn",
      "postgresql/no-drop-table-cascade": "warn",
      "postgresql/no-grant-to-public": "warn",
      "postgresql/no-group-by-ordinal": "warn",
      "postgresql/no-having-without-group-by": "error",
      "postgresql/no-implicit-join": "warn",
      "postgresql/no-leading-wildcard-like": "warn",
      "postgresql/no-money-type": "error",
      "postgresql/no-natural-join": "error",
      "postgresql/no-not-in-subquery": "error",
      "postgresql/no-numeric-without-precision": "warn",
      "postgresql/no-order-by-ordinal": "warn",
      "postgresql/no-rename-column": "warn",
      "postgresql/no-rename-table": "warn",
      "postgresql/no-select-into": "warn",
      "postgresql/no-set-not-null": "warn",
      "postgresql/no-set-search-path": "warn",
      "postgresql/no-syntax-error": "error",
      "postgresql/no-temporary-table": "warn",
      "postgresql/no-time-type": "warn",
      "postgresql/no-truncate-cascade": "warn",
      "postgresql/no-unlogged-table": "warn",
      "postgresql/no-vacuum-full": "warn",
      "postgresql/prefer-bigint-id": "warn",
      "postgresql/prefer-coalesce-over-case": "warn",
      "postgresql/prefer-explicit-null-ordering": "warn",
      "postgresql/prefer-fk-not-valid": "warn",
      "postgresql/prefer-identity-over-serial": "warn",
      "postgresql/prefer-jsonb-over-json": "warn",
      "postgresql/prefer-reindex-concurrently": "warn",
      "postgresql/prefer-text-over-varchar": "warn",
      "postgresql/prefer-timestamptz": "warn",
      "postgresql/require-limit": "warn",
      "postgresql/require-named-constraint": "warn",
      "postgresql/require-primary-key": "warn",
      "postgresql/require-where-in-delete": "error",
      "postgresql/require-where-in-update": "error",
      "postgresql/snake-case-column-name": "warn",
      "postgresql/snake-case-table-name": "warn",
    },
  } satisfies Linter.Config,
};

export default plugin;
