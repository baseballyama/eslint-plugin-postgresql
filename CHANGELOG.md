# eslint-plugin-postgresql

## 0.11.0

### Minor Changes

- [#168](https://github.com/baseballyama/eslint-plugin-postgresql/pull/168) [`43ec485`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/43ec485d11415caea024b1640bb832a43185996a) Thanks [@baseballyama](https://github.com/baseballyama)! - **BREAKING**: Renamed `prefer-create-or-replace` to `consistent-create-or-replace` and added a `style` option so users can enforce either stance with a single rule. The `style` option accepts:
  - `"always"` (default): require `OR REPLACE` on `CREATE FUNCTION` / `PROCEDURE` / `VIEW` so re-running a migration is idempotent. This is the original behavior of `prefer-create-or-replace`.
  - `"never"`: forbid `OR REPLACE` so unintended overwrites surface as `relation already exists` and must be addressed explicitly.

  Both styles are auto-fixable: `always` inserts ` OR REPLACE` after `CREATE`; `never` removes the ` OR REPLACE` keywords.

  Migration:

  ```diff
  - "postgresql/prefer-create-or-replace": "warn"
  + "postgresql/consistent-create-or-replace": ["warn", { "style": "always" }]
  ```

  The previous rule was off by default in `configs.recommended`, so users not configuring it explicitly are unaffected. The `messageId` `preferOrReplace` is preserved for the `always` style; the new `unexpectedOrReplace` covers the `never` style.

## 0.10.0

### Minor Changes

- [#165](https://github.com/baseballyama/eslint-plugin-postgresql/pull/165) [`0d974d0`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/0d974d07d46dc28ebcf5ef9207a2c38594d394e7) Thanks [@baseballyama](https://github.com/baseballyama)! - Three migration-safety rules added to `configs.recommended` at
  `error`:
  - `no-add-check-constraint-without-not-valid` — companion to
    `prefer-fk-not-valid`; CHECK constraints added without `NOT VALID`
    hold `ACCESS EXCLUSIVE` for the entire validating scan.
  - `no-add-unique-constraint-directly` — inline
    `ALTER TABLE ... ADD CONSTRAINT ... UNIQUE (cols)` builds the
    underlying index synchronously under `ACCESS EXCLUSIVE`. Build the
    index out-of-band with `CREATE UNIQUE INDEX CONCURRENTLY` and then
    promote it via `ADD CONSTRAINT ... UNIQUE USING INDEX <name>`.
  - `no-volatile-default-on-add-column` — `ADD COLUMN ... DEFAULT
random()` (or any other VOLATILE function) forces a full table
    rewrite under `ACCESS EXCLUSIVE` because the PG10+ stable-default
    short-cut cannot apply. Recognized volatile generators include
    `random`, `gen_random_uuid`, `uuid_generate_v1*`, `uuid_generate_v4`,
    `clock_timestamp`, `timeofday`. `now()` / `current_timestamp` /
    `current_date` are STABLE within a statement and not flagged.

- [#164](https://github.com/baseballyama/eslint-plugin-postgresql/pull/164) [`7760a95`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/7760a95501f2db966d772d4e6d729a0af55cc8c0) Thanks [@baseballyama](https://github.com/baseballyama)! - Add 3 new rules and extend `prefer-current-timestamp-over-now`:
  - `no-grant-all`: forbids `GRANT ALL` (catch-all privilege grants are too coarse — list privileges explicitly).
  - `prefer-exists-over-in-subquery`: prefer `EXISTS (subquery)` over `column IN (subquery)`. `IN` semantics with NULL on the right side surprise users; `EXISTS` is also typically cheaper.
  - `require-index-on-fk-column`: every foreign-key column must be backed by a leading-column index in the same file. Cross-statement (looks across `CREATE TABLE`, `CREATE INDEX`, `ALTER TABLE ADD CONSTRAINT`).
  - `prefer-current-timestamp-over-now`: now also flags bareword `LOCALTIMESTAMP` / `LOCALTIME` and autofixes them to `CURRENT_TIMESTAMP` / `CURRENT_TIME`. New message IDs `preferCurrentTimestampOverLocal` / `preferCurrentTimeOverLocal`.

  The three new rules are in `configs.recommended` at `warn`.

- [#161](https://github.com/baseballyama/eslint-plugin-postgresql/pull/161) [`2ed978a`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/2ed978ae0de89965c5a0ac03ccfe20ba020a4609) Thanks [@baseballyama](https://github.com/baseballyama)! - Three security/correctness rules added to `configs.recommended` at
  `error`:
  - `no-security-definer-without-search-path` — `SECURITY DEFINER`
    functions that omit `SET search_path = ...` are a well-known
    privilege-escalation vector. An attacker who can create a schema
    in the caller's `search_path` can shadow built-in objects called
    from inside the function body and get arbitrary code execution as
    the function owner. Pin `search_path` (e.g. to `pg_catalog,
pg_temp`) on every `SECURITY DEFINER` definition.
  - `no-equality-with-null` — `x = NULL` / `x <> NULL` always evaluate
    to NULL (treated as false), silently filtering away rows the author
    intended to keep. The fix is `IS NULL` / `IS NOT NULL`.
  - `no-update-without-from-binding` — `UPDATE t SET ... FROM other`
    without a `WHERE` clause produces a Cartesian product with the
    target and updates every row of `t` once per row of `other`. Add a
    join condition in `WHERE`.

### Patch Changes

- [#166](https://github.com/baseballyama/eslint-plugin-postgresql/pull/166) [`3cd2e19`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/3cd2e19633431aafc63d63c190151b19763918b2) Thanks [@baseballyama](https://github.com/baseballyama)! - Docs site catalog now covers every shipped rule, with options documented
  for rules that take them. A new smoke test asserts that every entry in
  `plugin.rules` has a matching entry in `site/src/lib/data/rules.ts`, so
  adding a rule without updating the catalog now fails CI.

- [#160](https://github.com/baseballyama/eslint-plugin-postgresql/pull/160) [`db2c02e`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/db2c02ede5e07a0ae8b24bbd0748e915c5c088aa) Thanks [@baseballyama](https://github.com/baseballyama)! - Closes #159: `require-limit` no longer fires on
  `INSERT INTO ... VALUES (...)`. libpg-query rewrites the `VALUES`
  list as a synthetic `SelectStmt` with a populated `valuesLists`, and
  the rule now recognizes that shape and skips it.

## 0.9.0

### Minor Changes

- [#158](https://github.com/baseballyama/eslint-plugin-postgresql/pull/158) [`6678ff4`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/6678ff4cc52ad4d848292fdb26cdc6b70e796f8b) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/prefer-create-or-replace` (off by default; opt in via
  `configs.all` or per project). Requires `CREATE FUNCTION`,
  `CREATE PROCEDURE`, and `CREATE VIEW` to use the `OR REPLACE` form so
  re-running a migration on a database that already defined the object
  does not abort with `... already exists`.

  Auto-fixable: inserts ` OR REPLACE` after the `CREATE` keyword.

- [#157](https://github.com/baseballyama/eslint-plugin-postgresql/pull/157) [`0472fe6`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/0472fe68e81bb5d4d20efc99f718926805000734) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/require-if-exists` (off by default; opt in via
  `configs.all` or per project). Requires every top-level `DROP`
  statement to include `IF EXISTS`, so re-running a migration on a
  database that already lost the object does not abort with `ERROR:
table "foo" does not exist`.

  Auto-fixable: inserts ` IF EXISTS` after the object-kind keyword
  (`DROP TABLE foo;` → `DROP TABLE IF EXISTS foo;`). Covers `DropStmt`
  (table, index, function, trigger, schema, ...), `DropdbStmt`,
  `DropRoleStmt`, and `DropSubscriptionStmt`.

### Patch Changes

- [#155](https://github.com/baseballyama/eslint-plugin-postgresql/pull/155) [`cc32edb`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/cc32edbe84014834a4d5d879a77baa0a15441179) Thanks [@baseballyama](https://github.com/baseballyama)! - `align-column-definitions` now realigns column rows that carry a
  trailing `--` or `/* */` comment after the constraints (e.g.
  `id ulid PRIMARY KEY, -- the surrogate key`). Previously the rule
  bailed on the whole table when any line had a comment, even when the
  comment was safely outside the rewrite range. Inline comments
  _inside_ a column's name/type/constraints span are still skipped
  (rewriting them would clobber the comment text).

## 0.8.0

### Minor Changes

- [#154](https://github.com/baseballyama/eslint-plugin-postgresql/pull/154) [`8f908f3`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/8f908f36f9f1c37eac9020a8ea43143b6295bab2) Thanks [@baseballyama](https://github.com/baseballyama)! - `postgresql/prefer-keyword-case` gains a `types` option for casing
  built-in type-name keywords (`text`, `int`, `bigint`, `numeric`, ...).

  ```jsonc
  {
    "rules": {
      "postgresql/prefer-keyword-case": [
        "error",
        { "case": "upper", "types": "upper" },
      ],
    },
  }
  ```

  Values:
  - `"skip"` (default) — leave type-name keywords alone, current 0.7.0
    behavior. Avoids mixed casing in signatures that mix built-ins with
    user-defined identifiers (#145).
  - `"upper"` — force type names to uppercase across all positions
    (column defs, function args, casts, ...).
  - `"lower"` — force type names to lowercase across all positions.

  Closes the enhancement portion of #152: projects whose convention is
  "all type references one case, everywhere" can now opt in.

- [#153](https://github.com/baseballyama/eslint-plugin-postgresql/pull/153) [`e5a3e7f`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/e5a3e7ff8832269c6f43966d1e903f0d8fcf6bee) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-update-primary-key` (in `configs.recommended` at
  `error`).

  Visits `UpdateStmt` and flags any `SET <pk> = ...` where `<pk>` matches
  a heuristic for "this is the table's primary-key column":
  - The literal name `id` (configurable via the `pkColumnNames` option).
  - The pattern `<table>_id` (auto-derived per statement from
    `relation.relname`).

  Primary keys are intended to be immutable — FK references, audit logs,
  and external systems can hold the old value. Without schema knowledge
  the rule has to guess; the heuristic is intentionally narrow and the
  option lets a project add its own conventions (`uuid`, `<table>_pk`,
  etc.).

- [#141](https://github.com/baseballyama/eslint-plugin-postgresql/pull/141) [`a561c3f`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/a561c3ff305af347b59153fc4e3185d892879fa9) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/prefer-cast-operator` (in `configs.stylistic`,
  auto-fixable).

  Enforces a single style for type casts: defaults to the operator form
  (`x::integer`), pass `["error", { "form": "function" }]` to flip to
  `CAST(x AS integer)`.

  The rule walks the token stream after detecting the cast's source form
  (the token at the `TypeCast` node's location is either `CAST` or
  `::`), so qualified type names (`schema.type`) and parameterized types
  (`numeric(10, 2)`) are handled without depending on the parser's
  partial `typeName.range`.

- [#151](https://github.com/baseballyama/eslint-plugin-postgresql/pull/151) [`485f278`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/485f27898afba1e5fe950943daefbc8b92034c5e) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/require-on-delete-action` (in `configs.recommended` at
  `warn`). Companion to `no-on-delete-cascade`: requires every foreign-key
  constraint to spell out an explicit `ON DELETE` clause. The implicit
  default is `NO ACTION`, but making the choice visible at constraint
  definition time means reviewers can see whether an FK's intent is to
  restrict, set null, or just default — instead of guessing.

  Detection is token-based: AST's `fk_del_action === 'a'` does not
  distinguish "no clause written" from "explicit `ON DELETE NO ACTION`",
  so the rule walks the constraint's source span and reports if no
  `ON DELETE` keyword pair appears at paren-depth 0.

## 0.7.0

### Minor Changes

- [#149](https://github.com/baseballyama/eslint-plugin-postgresql/pull/149) [`454798d`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/454798d6929dfdae44615cdfad4d7558806148b6) Thanks [@baseballyama](https://github.com/baseballyama)! - - **#145 fix:** `prefer-keyword-case` no longer uppercases built-in
  type keywords (`text`, `int`, `real`, `bigint`, `numeric`, ...) in
  positions where user-defined type identifiers are also valid
  (function signatures, column types, `CAST(... AS ...)`, `x::type`).
  The previous behavior left mixed casing in the same arg list when
  the file used custom domain or enum names alongside built-ins. The
  rule now skips `Keyword` tokens that land at the parser's `names`
  (typeName) positions.
  - **#146 feat:** new `postgresql/align-values` rule (`configs.stylistic`,
    auto-fixable). Aligns column values vertically inside multi-row
    `INSERT ... VALUES (...)`. Uses per-column max width across the
    current rows so deleting a wide value tightens the layout. Skips
    multi-line tuples, lines with inline comments, and rows with
    mismatched column counts.

### Patch Changes

- [#147](https://github.com/baseballyama/eslint-plugin-postgresql/pull/147) [`7b5b8fd`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/7b5b8fdaa2e4c08478e8b83755b5382c9820945b) Thanks [@baseballyama](https://github.com/baseballyama)! - Four autofix correctness bugs reported against 0.6.0:
  - **#140 fix:** `prefer-between-over-and` and `prefer-in-list-over-or`
    no longer drop the literal operand of cast expressions. The rules
    used `node.range` directly, but `TypeCast.range` covers only the
    `::` operator (or the `CAST` keyword) — so `'1900-01-01'::TIMESTAMPTZ`
    collapsed to just `::` in the rewrite, producing invalid SQL like
    `BETWEEN :: AND ::TIMESTAMPTZ`. Both rules now compute true source
    ranges by walking descendants.
  - **#142 fix:** `align-column-definitions` now keeps `TYPE[]` (and
    `TYPE[3]`, `TYPE[][]`) together as a single alignment column, the
    same way `TIMESTAMP(3)` was already handled. The parser does not
    emit `[` / `]` as tokens, so the rule consumes any bracket suffix
    directly from the source text when `typeName.arrayBounds` is set.
  - **#143 fix:** `require-trailing-semicolon` no longer inserts `;`
    in the middle of `NOT NULL` of the last column in a single-statement
    `CREATE TABLE`. The parser's per-statement `range[1]` is unreliable
    for single-statement files; the rule reverts to a file-level check
    ("the last source token must be `;`") which catches the original
    user intent without relying on internal-node ranges.
  - **#144 fix:** `prefer-keyword-case` no longer uppercases identifier
    tokens whose spelling collides with a SQL keyword (`trigger`,
    `user`, `order`, ...). The rule now collects identifier positions
    from the AST (`ColumnDef`, `RangeVar`, `Constraint`) and skips
    `Keyword` tokens that land at one of those positions.

## 0.6.0

### Minor Changes

- [#138](https://github.com/baseballyama/eslint-plugin-postgresql/pull/138) [`04a8c6e`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/04a8c6eb6e33427922364ec9aaf1ca70fdea0f84) Thanks [@baseballyama](https://github.com/baseballyama)! - Three issues fixed plus a parser dep bump:
  - **#136 fix:** `require-trailing-semicolon` no longer appends a run of
    bare `;` characters at EOF when the file contains a parser-level
    syntax error. The rule now skips `SQLParseError` body entries; their
    range covers the whole file (or its tail) and inserting `;` cannot
    turn malformed SQL into valid SQL.
  - **#137 fix:** `align-column-definitions` now treats parameterized
    types like `TIMESTAMP(3)`, `VARCHAR(255)`, `NUMERIC(10, 2)` as a
    single alignment column. Previously the bare type name and its
    `(...)` modifier landed in different lanes, splitting `TIMESTAMP(3)`
    into `TIMESTAMP  (3)` and dragging the type column's width down.
  - **#132 feat:** `snake-case-column-name` and `snake-case-table-name`
    gain a shared `allow` option (`string[]`, default `[]`). Listed
    identifiers are exempted from the snake_case check by exact-match.
    Default behavior is unchanged.
  - Bumps `postgresql-eslint-parser` to `^0.5.0`, which fixes inner-node
    range aggregation for descendants without observed locations.

## 0.5.0

### Minor Changes

- [#133](https://github.com/baseballyama/eslint-plugin-postgresql/pull/133) [`0a525d4`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/0a525d4310c24e271a84d9c6dcb3315c9a285bb1) Thanks [@baseballyama](https://github.com/baseballyama)! - Five new correctness rules. Four are added to `configs.recommended` at
  `warn` (or `error` for the safety-critical one); the fifth parallels
  `prefer-create-index-concurrently` and is off by default.
  - `no-rule` — disallow `CREATE RULE`; PostgreSQL's rule system has
    surprising semantics around row counts and `RETURNING`. Prefer a
    trigger or an updatable view. (warn)
  - `no-on-delete-cascade` — disallow `ON DELETE CASCADE` on foreign keys;
    the propagation is silent and can wipe out far more rows than the
    author intended. Use `RESTRICT` / `SET NULL` and clean up explicitly.
    (warn)
  - `no-with-recursive-without-limit` — disallow `WITH RECURSIVE` queries
    whose outer `SELECT` has no `LIMIT`; protects against unbounded
    execution when the recursion's termination condition is wrong.
    (error)
  - `prefer-add-constraint-not-valid` — `ALTER TABLE ... ADD CONSTRAINT
... CHECK / FOREIGN KEY` should use `NOT VALID` so the validating
    scan does not hold `ACCESS EXCLUSIVE` on the full table; run
    `VALIDATE CONSTRAINT` separately. (warn)
  - `prefer-drop-index-concurrently` — mirror of
    `prefer-create-index-concurrently`. Off by default.

- [#135](https://github.com/baseballyama/eslint-plugin-postgresql/pull/135) [`eabc69e`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/eabc69ed492c4c456f944672ca1fa688fab4ee8d) Thanks [@baseballyama](https://github.com/baseballyama)! - Two new structural-rewrite rules in `configs.stylistic`, both
  auto-fixable:
  - `prefer-in-list-over-or` — collapse `x = 1 OR x = 2 OR x = 3` into
    `x IN (1, 2, 3)`. Triggers only when every disjunct is an equality
    on the same lexpr (compared by source text).
  - `prefer-between-over-and` — rewrite `x >= a AND x <= b` as
    `x BETWEEN a AND b`. Strict inequalities (`> / <`) are not flagged
    because they are not equivalent to `BETWEEN`.

  `prefer-cast-operator` (`CAST(x AS int)` ↔ `x::int`) is intentionally
  deferred: the parser exposes only a partial range for qualified type
  names, so a safe rewrite needs token-level boundary detection that is
  its own piece of work.

## 0.4.0

### Minor Changes

- [#130](https://github.com/baseballyama/eslint-plugin-postgresql/pull/130) [`fa55fb9`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/fa55fb9e57e6d30f2f91363041eb3ec15cb5127b) Thanks [@baseballyama](https://github.com/baseballyama)! - `postgresql/align-column-definitions`:
  - New `gap` option (integer, default `2`) controls the minimum number of
    spaces inserted between the name / type / constraints lanes.
  - Tables that mix column definitions with table-level constraints
    (`PRIMARY KEY (a, b)`, `CHECK (...)`, etc.) are now realigned. The
    table-level constraint rows are preserved as-is; only the ColumnDef
    rows are touched.

- [#128](https://github.com/baseballyama/eslint-plugin-postgresql/pull/128) [`88d36a6`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/88d36a6de9371d3e7113b773380af515ec39ab59) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/align-column-definitions` (in `configs.stylistic`,
  auto-fixable).

  Aligns column definitions inside a `CREATE TABLE` so that name, type,
  and constraints share consistent column offsets across rows. Two-space
  gap between fields, computed from the longest name and longest type in
  the table.

  Conservative on purpose: skips tables that mix column definitions with
  table-level constraints, tables that have multi-line column defs, and
  lines that carry inline `--` or `/*` comments. These cases need more
  careful source surgery and are deferred.

- [#131](https://github.com/baseballyama/eslint-plugin-postgresql/pull/131) [`1b38488`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/1b38488004b7a9dce9334fedbc386a1a04a68a9f) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `configs.all`: every rule the plugin ships, enabled at `error`.
  Built mechanically from `plugin.rules`, so any rule added later is
  automatically included. Intended for users who want to audit the full
  catalog and turn off only what they actively don't want.

- [#127](https://github.com/baseballyama/eslint-plugin-postgresql/pull/127) [`99eb305`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/99eb305b3923bdcd0037df4298705656796076bd) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-unnecessary-quoted-identifier` (in `configs.stylistic`,
  auto-fixable).

  Detects double-quoted identifiers like `"users"` whose quoting is
  redundant — the unquoted form means the same thing in PostgreSQL — and
  strips the quotes.

  The rule is conservative on purpose: it leaves quoting in place for any
  mixed-case identifier (since unquoted identifiers case-fold to lowercase)
  and for any keyword that is reserved in any context (sourced from
  PostgreSQL 17's `kwlist.h`). The keyword list is regenerated by
  `pnpm generate-pg-keywords`; bump and re-run when bumping the parser
  across PostgreSQL major versions.

- [#129](https://github.com/baseballyama/eslint-plugin-postgresql/pull/129) [`c17d401`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/c17d401a793d3b4e3a0ccff6d21318feb7298511) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/plpgsql-keyword-case` (in `configs.stylistic`,
  auto-fixable).

  The existing `prefer-keyword-case` rule walks SQL tokens, which now stops
  at the `$$...$$` boundary (the body is a single String token). This new
  rule covers what's inside PL/pgSQL function bodies — both the embedded
  SQL and the PL-specific keywords like `BEGIN`, `EXCEPTION`, `RAISE`.

  Operates only on `EmbeddedCode` nodes whose `language` is `plpgsql`.
  String literals (`'...'`) and comments (`--`, `/* */`) inside the body
  are skipped so identifiers that happen to spell a keyword are left alone
  when they appear in those contexts.

  Keyword set is the union of PostgreSQL 17's `kwlist.h` and the PL/pgSQL
  `pl_reserved_kwlist.h` / `pl_unreserved_kwlist.h` — 540 keywords total.
  Re-run `pnpm generate-pg-keywords` when bumping libpg-query across PG
  major versions.

- [#122](https://github.com/baseballyama/eslint-plugin-postgresql/pull/122) [`eea267f`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/eea267fb9749a5203b96f0665599a1752ddfe093) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `configs.stylistic` preset and the first rule in it,
  `postgresql/prefer-keyword-case`. The new preset is opt-in and groups
  auto-fixable layout / casing rules; PostgreSQL formatters do not cover
  PL/pgSQL well, so this plugin will host a stylistic layer of its own.

  `prefer-keyword-case` enforces consistent casing for SQL keywords. The
  default is `upper`; pass `["error", { case: "lower" }]` to flip it. Auto-
  fixable.

- [#124](https://github.com/baseballyama/eslint-plugin-postgresql/pull/124) [`8959a46`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/8959a46e66e3c77967b92698e212fd8f02962e8b) Thanks [@baseballyama](https://github.com/baseballyama)! - Add four token-walking stylistic rules to `configs.stylistic`, all auto-
  fixable:
  - `prefer-not-equals-operator` — enforce a single style for the not-equal
    operator (`<>` or `!=`); default `<>`.
  - `prefer-current-timestamp-over-now` — rewrite `now()` to the SQL-standard
    `CURRENT_TIMESTAMP`.
  - `prefer-explicit-inner-join` — rewrite bare `JOIN` to `INNER JOIN`.
  - `prefer-explicit-outer-join` — rewrite `LEFT|RIGHT|FULL JOIN` to
    `LEFT|RIGHT|FULL OUTER JOIN`.

  Bumps `postgresql-eslint-parser` to `^0.2.0` so dollar-quoted PL/pgSQL
  bodies no longer leak spurious tokens into rule visitors.

- [#125](https://github.com/baseballyama/eslint-plugin-postgresql/pull/125) [`f0b4f4b`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/f0b4f4b0b7260781b449d73b51d184f7e13e0d68) Thanks [@baseballyama](https://github.com/baseballyama)! - Add three AST-aware stylistic rules to `configs.stylistic`, all auto-
  fixable:
  - `prefer-as-for-table-alias` — require `AS` before table aliases
    (`FROM users AS u`, not `FROM users u`).
  - `prefer-as-for-column-alias` — require `AS` before column aliases in
    `SELECT` lists. Restricted to `SelectStmt.targetList` so INSERT column
    lists and UPDATE SET clauses are not affected.
  - `require-trailing-semicolon` — require the file to end with a `;`.

- [#126](https://github.com/baseballyama/eslint-plugin-postgresql/pull/126) [`aca7f92`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/aca7f92667c674cef5fba89021f9ca3421c35d6e) Thanks [@baseballyama](https://github.com/baseballyama)! - Tighten `require-trailing-semicolon` to check every top-level statement
  individually, not just the file's last token.

  Bumps `postgresql-eslint-parser` to `^0.4.0`, which carries the
  `stmt_location` / `stmt_len` fix that makes per-statement ranges
  trustworthy.

## 0.3.0

### Minor Changes

- [#95](https://github.com/baseballyama/eslint-plugin-postgresql/pull/95) [`2db3819`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/2db38190e0cc89d2cafe3c86ae5abf6ef07be5d5) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-add-column-not-null-without-default` rule: errors when `ALTER TABLE ... ADD COLUMN ... NOT NULL` is missing a `DEFAULT`, which causes the migration to fail on any non-empty table. Enabled at `error` severity in `configs.recommended`.

- [#99](https://github.com/baseballyama/eslint-plugin-postgresql/pull/99) [`3fd5e4c`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/3fd5e4c2dcbb4cd10ce9004fc47d424f7f4b909d) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-alter-column-type` rule: warns on `ALTER TABLE ... ALTER COLUMN ... TYPE ...`, which may rewrite the entire table under an `ACCESS EXCLUSIVE` lock. Enabled at `warn` severity in `configs.recommended`.

- [#115](https://github.com/baseballyama/eslint-plugin-postgresql/pull/115) [`33ea9bc`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/33ea9bcc51252cf97e46075ffd0ce1495e9d25c6) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-cluster` rule: warns on the `CLUSTER` statement because it takes `ACCESS EXCLUSIVE`, rewrites the table, and PostgreSQL does not keep rows clustered as you continue to write. Use `pg_repack --order-by` for online clustering. Enabled at `warn` severity in `configs.recommended`.

- [#119](https://github.com/baseballyama/eslint-plugin-postgresql/pull/119) [`d141e23`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/d141e23fada5b0613cd6fe91cbc3bf2151bf2530) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-create-role` rule: warns on `CREATE ROLE` / `CREATE USER` in versioned SQL. Roles and credentials belong in an operator-managed bootstrap workflow, not in application migrations. Granting privileges to existing roles remains fine. Enabled at `warn` severity in `configs.recommended`.

- [#93](https://github.com/baseballyama/eslint-plugin-postgresql/pull/93) [`4b61a9b`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/4b61a9ba92342fb05697ece3e9e7e0da29733a69) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-distinct-on-without-order-by` rule: errors when `SELECT DISTINCT ON (...)` is used without `ORDER BY`. Without an ordering, the surviving row in each group is arbitrary and depends on scan order. Enabled at `error` severity in `configs.recommended`.

- [#102](https://github.com/baseballyama/eslint-plugin-postgresql/pull/102) [`266cff6`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/266cff6cda4a7f0be6d990ceb216a67dbe083490) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-drop-column` rule: warns on `ALTER TABLE ... DROP COLUMN`, which breaks every running app instance that still references the column. Enabled at `warn` severity in `configs.recommended`.

- [#116](https://github.com/baseballyama/eslint-plugin-postgresql/pull/116) [`7fba99c`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/7fba99cd6f3f9fa186efd10496bf7e5578800b88) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-drop-database` rule: errors on `DROP DATABASE`, which is catastrophic and irreversible and should not live in versioned SQL applied unattended by a migration tool. Enabled at `error` severity in `configs.recommended`.

- [#103](https://github.com/baseballyama/eslint-plugin-postgresql/pull/103) [`55eb219`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/55eb219aaa03f5fc1f97db55fd50fcf7ebf1dbf3) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-drop-not-null` rule: warns on `ALTER TABLE ... ALTER COLUMN ... DROP NOT NULL` because relaxing the constraint silently breaks every consumer that already assumes the column is non-null. Enabled at `warn` severity in `configs.recommended`.

- [#117](https://github.com/baseballyama/eslint-plugin-postgresql/pull/117) [`1563d3f`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/1563d3fbfa5e4781c23e415227b9e5bfd7529600) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-drop-schema-cascade` rule: warns on `DROP SCHEMA ... CASCADE`, which silently removes every object in the schema. The companion to `no-drop-table-cascade` with a much larger blast radius. Enabled at `warn` severity in `configs.recommended`.

- [#92](https://github.com/baseballyama/eslint-plugin-postgresql/pull/92) [`3892de3`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/3892de363ca22ba13641222292afb0541b32897d) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-group-by-ordinal` rule: warns on positional `GROUP BY` references like `GROUP BY 1, 2`, which silently shift to a different column when the SELECT list is reordered. Enabled at `warn` severity in `configs.recommended`.

- [#98](https://github.com/baseballyama/eslint-plugin-postgresql/pull/98) [`06cfaac`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/06cfaacca399cef631e81258fb37901523dfb9a6) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-having-without-group-by` rule: errors when a `SELECT` uses `HAVING` with no `GROUP BY`, which collapses the query to a single aggregate row over the whole table. Enabled at `error` severity in `configs.recommended`.

- [#94](https://github.com/baseballyama/eslint-plugin-postgresql/pull/94) [`c6558ba`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/c6558ba7ebbc491d8f7d4f91977917194d6618d6) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-leading-wildcard-like` rule: warns on `LIKE`/`ILIKE` patterns that begin with `%`, which cannot use a B-tree index and force a sequential scan. Enabled at `warn` severity in `configs.recommended`.

- [#108](https://github.com/baseballyama/eslint-plugin-postgresql/pull/108) [`f3dceb5`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/f3dceb54f3b96dee07ec4cf277bf17c8d60c9d2a) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-numeric-without-precision` rule: warns on bare `NUMERIC` / `DECIMAL` column declarations and recommends declaring an explicit `NUMERIC(precision, scale)`. Enabled at `warn` severity in `configs.recommended`.

- [#90](https://github.com/baseballyama/eslint-plugin-postgresql/pull/90) [`d8f4b6a`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/d8f4b6a615b9182e0796bd21bbe092383a4a49d3) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-order-by-ordinal` rule: warns on positional `ORDER BY` references like `ORDER BY 1, 2`, which silently break when the SELECT list changes. Enabled at `warn` severity in `configs.recommended`.

- [#100](https://github.com/baseballyama/eslint-plugin-postgresql/pull/100) [`511e83f`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/511e83f76915e6671ac151ae409585264483b5be) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-rename-column` rule: warns on `ALTER TABLE ... RENAME COLUMN` because every running app instance that still references the old name errors the moment the migration runs. Enabled at `warn` severity in `configs.recommended`.

- [#101](https://github.com/baseballyama/eslint-plugin-postgresql/pull/101) [`ca1809a`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/ca1809a7fa4d8b7a3c88c4c1dc9ef489fc89ae21) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-rename-table` rule: warns on `ALTER TABLE ... RENAME TO`, which breaks every running app that still queries the old name. Enabled at `warn` severity in `configs.recommended`.

- [#96](https://github.com/baseballyama/eslint-plugin-postgresql/pull/96) [`5b1acdf`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/5b1acdfd20eb5c191572e05b051aac2b986d1614) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-select-into` rule: warns on `SELECT ... INTO target FROM ...`, which silently creates a new table and is confusable with PL/pgSQL's row-assignment form. Prefer `CREATE TABLE target AS SELECT ...`. Enabled at `warn` severity in `configs.recommended`.

- [#110](https://github.com/baseballyama/eslint-plugin-postgresql/pull/110) [`0ac2ab6`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/0ac2ab6e67a3452f9f92ca2afb584ac702e80cf1) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-set-not-null` rule: warns on `ALTER TABLE ... ALTER COLUMN ... SET NOT NULL` because the operation requires a full table scan under `ACCESS EXCLUSIVE`. Use the `ADD CHECK ... NOT VALID` + `VALIDATE CONSTRAINT` + `SET NOT NULL` pattern instead. Enabled at `warn` severity in `configs.recommended`.

- [#111](https://github.com/baseballyama/eslint-plugin-postgresql/pull/111) [`f700bf7`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/f700bf7c16007b653cf2706e322c885abe5f0d6a) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-set-search-path` rule: warns on `SET search_path = ...` in versioned SQL because name resolution that depends on session state is a known footgun for SECURITY DEFINER functions and CREATE statements. Qualify identifiers with their schema instead. Enabled at `warn` severity in `configs.recommended`.

- [#107](https://github.com/baseballyama/eslint-plugin-postgresql/pull/107) [`f1cbce4`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/f1cbce4fffd9253b94b25acce6fb53fa130a045a) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-temporary-table` rule: warns on `CREATE TEMP/TEMPORARY TABLE` in versioned SQL because temporary tables exist only for the current session and almost never belong in migration files. Enabled at `warn` severity in `configs.recommended`.

- [#109](https://github.com/baseballyama/eslint-plugin-postgresql/pull/109) [`2442be1`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/2442be1761db97454b21b4043581a721d2135a3f) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-time-type` rule: warns on `TIME` and `TIME WITH TIME ZONE` (`timetz`) columns because they rarely model real-world values correctly. Use `timestamptz` for points in time, `interval` for durations, or `text` for a display value. Enabled at `warn` severity in `configs.recommended`.

- [#106](https://github.com/baseballyama/eslint-plugin-postgresql/pull/106) [`b043aed`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/b043aed720dbb09f63e32b8292e6ab2258e5dc53) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-unlogged-table` rule: warns on `CREATE UNLOGGED TABLE` because unlogged tables are truncated on crash, not replicated, and not restored from base backups. Enabled at `warn` severity in `configs.recommended`.

- [#114](https://github.com/baseballyama/eslint-plugin-postgresql/pull/114) [`ee72845`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/ee72845a2c9a17f0f45ad89ae2e274f75908894e) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/no-vacuum-full` rule: warns on `VACUUM FULL` because it takes `ACCESS EXCLUSIVE` and rewrites the whole table, making it unavailable for the duration. Plain `VACUUM` is fine. Enabled at `warn` severity in `configs.recommended`.

- [#120](https://github.com/baseballyama/eslint-plugin-postgresql/pull/120) [`817e00c`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/817e00c5efe86fe7b42dc43bc9d6eb03121db762) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/prefer-bigint-id` rule: warns when a primary-key `id` column is declared as `int`, `smallint`, `serial`, or `smallserial`. Widening an integer primary key later requires a full table rewrite under `ACCESS EXCLUSIVE`; declaring `bigint` from the start avoids that future incident. UUID primary keys and non-PK `id` columns are unaffected. Enabled at `warn` severity in `configs.recommended`.

- [#97](https://github.com/baseballyama/eslint-plugin-postgresql/pull/97) [`d50103f`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/d50103fa6749453cc95c3cdbca6cfbd459599780) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/prefer-coalesce-over-case` rule: flags `CASE WHEN x IS NULL THEN y ELSE x END` (and its `IS NOT NULL` mirror) and recommends the equivalent `COALESCE(x, y)`. Enabled at `warn` severity in `configs.recommended`.

- [#113](https://github.com/baseballyama/eslint-plugin-postgresql/pull/113) [`968fd68`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/968fd680eded5f7a72ee7017fbfcddfa2ef5d8fa) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/prefer-explicit-null-ordering` rule: warns when an `ORDER BY` term specifies an explicit `ASC`/`DESC` direction but no `NULLS FIRST` / `NULLS LAST`. Plain `ORDER BY x` (no direction) is left alone. Enabled at `warn` severity in `configs.recommended`.

- [#104](https://github.com/baseballyama/eslint-plugin-postgresql/pull/104) [`88638fa`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/88638fab7ef0f3a3f8146341bc8c8fa256e7df4a) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/prefer-fk-not-valid` rule: warns on `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY (...)` that does not include `NOT VALID`. Validating an FK takes an `ACCESS EXCLUSIVE` lock for the full scan; `NOT VALID` + a separate `VALIDATE CONSTRAINT` only needs `SHARE UPDATE EXCLUSIVE`. Enabled at `warn` severity in `configs.recommended`.

- [#118](https://github.com/baseballyama/eslint-plugin-postgresql/pull/118) [`48a87d5`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/48a87d5b6f55afba2e6e0f270c1e57ab40b9c789) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/prefer-reindex-concurrently` rule: warns on `REINDEX` without `CONCURRENTLY`, which locks the table (or index) for the duration of the rebuild. PG ≥ 12 supports concurrent reindexing. Enabled at `warn` severity in `configs.recommended`.

- [#105](https://github.com/baseballyama/eslint-plugin-postgresql/pull/105) [`ef77a81`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/ef77a8162729eea4cf3e389e071a7df8e5f9a23d) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/require-named-constraint` rule: warns when a table-level `CHECK`, `UNIQUE`, `FOREIGN KEY`, or `EXCLUSION` constraint is declared without an explicit `CONSTRAINT <name>`. Auto-generated constraint names vary across environments and make later `DROP CONSTRAINT` / `ALTER CONSTRAINT` statements brittle. Enabled at `warn` severity in `configs.recommended`.

- [#112](https://github.com/baseballyama/eslint-plugin-postgresql/pull/112) [`8bad71f`](https://github.com/baseballyama/eslint-plugin-postgresql/commit/8bad71fa6ea6ec24d882634f8ed88ec102d3a3e3) Thanks [@baseballyama](https://github.com/baseballyama)! - Add `postgresql/require-schema-qualified-table` rule: warns on `CREATE TABLE foo (...)` without a schema-qualified name. Off by default in `configs.recommended` because many projects keep everything in `public`; enable explicitly when you organize by schema.

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
