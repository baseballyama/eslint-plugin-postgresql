# eslint-plugin-postgresql

## 0.2.0

### Minor Changes

- [#85](https://github.com/baseballyama/eslint-plugin-postgresql/pull/85) [`46d8e4d`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/46d8e4d6e16a6e618c5ceed69d22a9c202e422a7) Thanks [@baseballyama](https://github.com/baseballyama)! - `configs.recommended` now includes a `plugins: { postgresql }` field. Spreading `...postgresql.configs.recommended` in a flat ESLint config now binds the plugin automatically, so consumers no longer have to add `plugins: { postgresql }` separately for the rule severities to resolve. The README example continues to work as written.

- [#74](https://github.com/baseballyama/eslint-plugin-postgresql/pull/74) [`0de0fa9`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/0de0fa99e9f3bd676c62879949d8fa431f9d34dd) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-char-type` rule: warns on blank-padded `char(n)` / `bpchar` columns. Enabled at `warn` severity in `configs.recommended`.

- [#66](https://github.com/baseballyama/eslint-plugin-postgresql/pull/66) [`7a964c8`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/7a964c82df8c11c26483357f445db24cf4745aaf) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-cross-join` rule: warns on `CROSS JOIN`. Enabled at `warn` severity in `configs.recommended`.

- [#64](https://github.com/baseballyama/eslint-plugin-postgresql/pull/64) [`5728c3a`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/5728c3a2ff496490b76d5abb484f3853ca3d91ca) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-drop-table-cascade` rule: warns on `DROP ... CASCADE` (table, schema, type, etc.) because CASCADE silently removes dependent objects. Enabled at `warn` severity in `configs.recommended`.

- [#75](https://github.com/baseballyama/eslint-plugin-postgresql/pull/75) [`83c62af`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/83c62af873d0cb72210bd3e4aa948a07c21d1836) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-grant-to-public` rule: warns on `GRANT ... TO PUBLIC` because PUBLIC covers every current and future role. `REVOKE ... FROM PUBLIC` is unaffected. Enabled at `warn` severity in `configs.recommended`.

- [#80](https://github.com/baseballyama/eslint-plugin-postgresql/pull/80) [`beda810`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/beda81099a13abd1678c7e5d66190e7a449e58be) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-implicit-join` rule: warns on comma-separated `FROM` clauses and recommends explicit `JOIN ... ON ...`. Enabled at `warn` severity in `configs.recommended`.

- [#73](https://github.com/baseballyama/eslint-plugin-postgresql/pull/73) [`7e82530`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/7e82530ce0bb15c3c0b5a32eb89a3bea2c632b19) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-money-type` rule: errors on the `money` column type. Enabled at `error` severity in `configs.recommended`.

- [#67](https://github.com/baseballyama/eslint-plugin-postgresql/pull/67) [`6c5bbdc`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/6c5bbdc52968a1bc04c247c6872b1a6ec5bab7ec) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-natural-join` rule: errors on `NATURAL JOIN` because the join columns are implicit and silently change when columns are added. Enabled at `error` severity in `configs.recommended`.

- [#77](https://github.com/baseballyama/eslint-plugin-postgresql/pull/77) [`39ff6db`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/39ff6dbc69e669a62f4d0a3c9ca1b878b4ca6438) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-not-in-subquery` rule: errors on `NOT IN (subquery)` because a single NULL in the subquery yields zero rows. Literal `NOT IN (1, 2, 3)` lists are unaffected. Enabled at `error` severity in `configs.recommended`.

- [#61](https://github.com/baseballyama/eslint-plugin-postgresql/pull/61) [`86401b5`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/86401b523c15150c7722cee40946b7820c68b4b2) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-select-star` rule: warns on `SELECT *` and `<alias>.*` so result schemas stay stable when the underlying table changes. Off by default; opt in by setting it in your ESLint config.

- [#65](https://github.com/baseballyama/eslint-plugin-postgresql/pull/65) [`86a8b58`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/86a8b58db25335b1bbcca60c2403344c268ea39d) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-truncate-cascade` rule: warns on `TRUNCATE ... CASCADE` because it transitively empties tables that have foreign keys referencing the target. Enabled at `warn` severity in `configs.recommended`.

- [#76](https://github.com/baseballyama/eslint-plugin-postgresql/pull/76) [`3936f18`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/3936f188eff04896bc039537074932b76f5d991f) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/prefer-create-index-concurrently` rule: warns on plain `CREATE INDEX` and recommends `CREATE INDEX CONCURRENTLY`. Off by default because the right answer depends on the migration framework.

- [#69](https://github.com/baseballyama/eslint-plugin-postgresql/pull/69) [`f61bc71`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/f61bc714b621f4e690b8ff45fa47e385c1c0f020) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/prefer-identity-over-serial` rule: warns on `SMALLSERIAL`, `SERIAL`, `BIGSERIAL` columns and recommends `GENERATED ALWAYS AS IDENTITY`. Enabled at `warn` severity in `configs.recommended`.

- [#68](https://github.com/baseballyama/eslint-plugin-postgresql/pull/68) [`7f29dda`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/7f29ddaed1ee54e64be1d3aaa49d4effffeb47fe) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/prefer-jsonb-over-json` rule: warns on columns declared as `json` and recommends `jsonb`. Enabled at `warn` severity in `configs.recommended`.

- [#71](https://github.com/baseballyama/eslint-plugin-postgresql/pull/71) [`d1f8a07`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/d1f8a076faacfdc66b92775835da74171b1a20be) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/prefer-text-over-varchar` rule: warns on `varchar(n)` and recommends `text` with a `CHECK` constraint when a length cap is needed. Enabled at `warn` severity in `configs.recommended`.

- [#72](https://github.com/baseballyama/eslint-plugin-postgresql/pull/72) [`03a9945`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/03a9945db471dc5a56ecb246b2e5e1bb5b1c2de8) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/prefer-timestamptz` rule: warns on `timestamp without time zone` columns and recommends `timestamptz`. Enabled at `warn` severity in `configs.recommended`.

- [#70](https://github.com/baseballyama/eslint-plugin-postgresql/pull/70) [`6142324`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/6142324a4439697b254d8cd72d26a1092100d14e) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/require-primary-key` rule: warns on `CREATE TABLE` statements that do not declare a primary key. Enabled at `warn` severity in `configs.recommended`.

- [#62](https://github.com/baseballyama/eslint-plugin-postgresql/pull/62) [`a4c56b3`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/a4c56b35740f306459123df2b5dc61b4517afe79) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/require-where-in-delete` rule: errors on `DELETE` statements without a `WHERE` clause to prevent accidentally emptying tables. Enabled at `error` severity in `configs.recommended`.

- [#63](https://github.com/baseballyama/eslint-plugin-postgresql/pull/63) [`3d0df38`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/3d0df381bc789461de2929306dec0fed80447dc3) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/require-where-in-update` rule: errors on `UPDATE` statements without a `WHERE` clause. Enabled at `error` severity in `configs.recommended`.

- [#79](https://github.com/baseballyama/eslint-plugin-postgresql/pull/79) [`5a085bf`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/5a085bf5b7d6a9b314d125e0604e09701d5f8505) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/snake-case-column-name` rule: warns when a column declared in `CREATE TABLE` is not snake_case. Enabled at `warn` severity in `configs.recommended`.

- [#78](https://github.com/baseballyama/eslint-plugin-postgresql/pull/78) [`05a47b2`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/05a47b2abdb19d50204b961cd13a114bcac55de5) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/snake-case-table-name` rule: warns when a `CREATE TABLE` declares a table name that is not snake_case (typically a quoted mixed-case identifier). Enabled at `warn` severity in `configs.recommended`.

## 0.1.0

### Minor Changes

- [`b188819`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/b1888190e90e16cd0e48d49638c3b9f7be516dba) Thanks [@baseballyama](https://github.com/baseballyama)! - feat: add `no-syntax-error` rule

- [`f32416a`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/f32416a2158fcfbd8e6e18a16f2580d56f300c2e) Thanks [@baseballyama](https://github.com/baseballyama)! - feat: add `require-limit` rule
