/**
 * Structured rule catalog. Hand-curated from the README and rule source.
 * Update both this file and the README in the same PR when a rule lands.
 *
 * `incorrect` and `correct` are SQL snippets used both on the rule detail
 * page and as seed input for the per-rule Playground.
 */

export type Severity = "error" | "warn" | "off";
export type RuleType = "problem" | "suggestion" | "layout";

export interface RuleOption {
  name: string;
  type: string;
  default?: unknown;
  description: string;
}

export interface RuleMeta {
  name: string;
  description: string;
  longDescription: string;
  type: RuleType;
  recommended: Severity;
  fixable: boolean;
  category: "syntax" | "safety" | "schema" | "perf" | "style" | "security";
  incorrect: string[];
  correct: string[];
  options?: RuleOption[];
}

export const rules: RuleMeta[] = [
  {
    name: "no-syntax-error",
    description: "Detect PostgreSQL syntax errors.",
    longDescription:
      "Surfaces every parse error from libpg-query as a single lint diagnostic. Without this rule the plugin would silently skip un-parseable files, which is exactly the case where a human reader needs the loudest possible signal.",
    type: "problem",
    recommended: "error",
    fixable: false,
    category: "syntax",
    incorrect: [
      "-- typo: should be SELECT\nINVALID_KEYWORD * FROM users;",
      "SELECT * FROM WHERE id = 1;",
    ],
    correct: ["SELECT * FROM users WHERE id = 1;"],
  },
  {
    name: "no-select-star",
    description:
      "Disallow `SELECT *` (and `<alias>.*`) so result schemas stay stable.",
    longDescription:
      "Listing columns explicitly keeps the result schema stable when the table evolves — a new column won't silently appear in callers, and a removed column won't silently disappear. The aggregate form `count(*)` is unaffected.",
    type: "suggestion",
    recommended: "off",
    fixable: false,
    category: "style",
    incorrect: ["SELECT * FROM users;", "SELECT u.* FROM users u;"],
    correct: [
      "SELECT id, name FROM users;",
      "SELECT count(*) FROM users; -- aggregate star is fine",
    ],
  },
  {
    name: "require-where-in-delete",
    description: "Require a WHERE clause on DELETE.",
    longDescription:
      "A `DELETE` without `WHERE` empties the entire table — almost always a mistake. Use `TRUNCATE` if you actually mean to wipe the table.",
    type: "problem",
    recommended: "error",
    fixable: false,
    category: "safety",
    incorrect: ["DELETE FROM users;"],
    correct: [
      "DELETE FROM users WHERE id = 1;",
      "DELETE FROM sessions WHERE expires_at < now();",
    ],
  },
  {
    name: "require-where-in-update",
    description: "Require a WHERE clause on UPDATE.",
    longDescription:
      "An `UPDATE` without `WHERE` rewrites every row in the table. The rule fires only on plain `UPDATE` statements; CTE-driven and view-based updates are not analyzed.",
    type: "problem",
    recommended: "error",
    fixable: false,
    category: "safety",
    incorrect: ["UPDATE users SET active = false;"],
    correct: ["UPDATE users SET active = false WHERE id = 1;"],
  },
  {
    name: "no-drop-table-cascade",
    description: "Warn on DROP TABLE ... CASCADE.",
    longDescription:
      "`CASCADE` silently removes dependent objects — foreign keys, views, sequences. The fix is to list dependents explicitly. The rule is scoped to `DROP TABLE`; other `DROP ... CASCADE` variants are out of scope.",
    type: "problem",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: ["DROP TABLE users CASCADE;"],
    correct: ["DROP TABLE users;", "DROP TABLE users RESTRICT;"],
  },
  {
    name: "no-truncate-cascade",
    description: "Warn on TRUNCATE ... CASCADE.",
    longDescription:
      "`TRUNCATE ... CASCADE` transitively empties every table whose foreign keys reference the target. That is essentially never the right tool for the intended operation.",
    type: "problem",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: ["TRUNCATE users CASCADE;"],
    correct: ["TRUNCATE users;", "TRUNCATE users RESTRICT;"],
  },
  {
    name: "no-cross-join",
    description: "Warn on CROSS JOIN.",
    longDescription:
      "If the intent really is a cartesian product, write `JOIN ... ON true` so the intent reads back. PostgreSQL rejects `INNER JOIN b` without `ON`/`USING`, so the explicit `CROSS JOIN` is the only form this rule sees in practice.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: ["SELECT * FROM a CROSS JOIN b;"],
    correct: [
      "SELECT * FROM a JOIN b ON a.id = b.id;",
      "SELECT * FROM a JOIN b ON true; -- intentional cartesian",
    ],
  },
  {
    name: "no-natural-join",
    description: "Disallow NATURAL JOIN — join columns are implicit.",
    longDescription:
      "Join columns are implicit. Add a column with a matching name to either side later and the join silently changes shape. Use `JOIN ... USING (...)` or `JOIN ... ON ...`.",
    type: "problem",
    recommended: "error",
    fixable: false,
    category: "safety",
    incorrect: ["SELECT * FROM a NATURAL JOIN b;"],
    correct: [
      "SELECT * FROM a JOIN b USING (id);",
      "SELECT * FROM a JOIN b ON a.id = b.id;",
    ],
  },
  {
    name: "consistent-jsonb-over-json",
    description:
      "Enforce a consistent stance on `jsonb` vs `json` for column types.",
    longDescription:
      "`jsonb` stores a parsed representation, supports GIN indexes, and is what application code almost always wants. `json` is only the right choice if you specifically need byte-exact round-tripping of input text. Pick one direction with the `style` option.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "schema",
    incorrect: ["CREATE TABLE events (payload JSON);"],
    correct: ["CREATE TABLE events (payload JSONB);"],
    options: [
      {
        name: "style",
        type: '"always" | "never"',
        default: '"always"',
        description:
          "`always` (default) requires `jsonb` over `json`. `never` requires `json` over `jsonb` for projects that rely on `json`'s preservation of key order, whitespace, and duplicate keys.",
      },
    ],
  },
  {
    name: "consistent-identity-over-serial",
    description:
      "Enforce a consistent stance on `GENERATED ... AS IDENTITY` vs `SERIAL` / `BIGSERIAL`.",
    longDescription:
      "Serial pseudo-types create a separately-owned sequence that does not round-trip cleanly through `pg_dump` and does not honor column-level privileges. `GENERATED ... AS IDENTITY` is the SQL-standard replacement and has been the PostgreSQL team's recommendation since version 10. Pick one direction with the `style` option.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "schema",
    incorrect: [
      "CREATE TABLE t (id BIGSERIAL);",
      "CREATE TABLE t (id SERIAL);",
    ],
    correct: ["CREATE TABLE t (id BIGINT GENERATED ALWAYS AS IDENTITY);"],
    options: [
      {
        name: "style",
        type: '"always" | "never"',
        default: '"always"',
        description:
          "`always` (default) requires identity columns over serial pseudo-types. `never` requires the serial pseudo-types for projects that keep compatibility with tooling that does not understand identity columns.",
      },
    ],
  },
  {
    name: "require-primary-key",
    description: "Require a primary key on CREATE TABLE.",
    longDescription:
      "Tables without a primary key cannot be replicated cleanly with logical replication, are hard to shard, and break most ORMs and migration tools. Partitions (`CREATE TABLE ... PARTITION OF ...`) inherit their parent's primary key and are not flagged.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "schema",
    incorrect: ["CREATE TABLE t (id INT, name TEXT);"],
    correct: [
      "CREATE TABLE t (id INT PRIMARY KEY, name TEXT);",
      "CREATE TABLE t (id INT, name TEXT, PRIMARY KEY (id));",
    ],
  },
  {
    name: "consistent-text-over-varchar",
    description: "Enforce a consistent stance on `text` vs `varchar(n)`.",
    longDescription:
      "PostgreSQL stores `text` and `varchar(n)` the same way. The length on `varchar(n)` is enforced by a per-table constraint that you cannot relax without rewriting the table. Use `text` with a `CHECK (length(col) <= N)` when you need a cap. Or invert the rule with the `style` option for projects that intentionally cap every string column at the type level.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "schema",
    incorrect: ["CREATE TABLE users (name VARCHAR(255));"],
    correct: [
      "CREATE TABLE users (name TEXT);",
      "CREATE TABLE users (name TEXT CHECK (length(name) <= 255));",
    ],
    options: [
      {
        name: "style",
        type: '"always" | "never"',
        default: '"always"',
        description:
          "`always` (default) requires `text` over `varchar(n)`. `never` requires `varchar(n)` (or another bounded string type) over `text`.",
      },
    ],
  },
  {
    name: "consistent-timestamptz",
    description:
      "Enforce a consistent stance on `timestamptz` vs `timestamp` for wall-clock columns.",
    longDescription:
      "Two valid stances exist: (a) require `timestamptz` so the database anchors everything to UTC at storage time and converts on read (avoiding the timezone-naive trap of `timestamp`), or (b) forbid `timestamptz` so the type is consistent across a project that treats every timestamp as UTC at the application layer and doesn't want implicit per-session `TimeZone` conversions. Pick one with the `style` option.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "schema",
    incorrect: ["CREATE TABLE t (created_at TIMESTAMP);"],
    correct: [
      "CREATE TABLE t (created_at TIMESTAMPTZ);",
      "CREATE TABLE t (created_at TIMESTAMP WITH TIME ZONE);",
    ],
    options: [
      {
        name: "style",
        type: '"always" | "never"',
        default: '"always"',
        description:
          "Which stance to enforce. `always` (default) requires `timestamptz` over `timestamp`. `never` requires `timestamp` over `timestamptz` — useful when the application treats every value as UTC and doesn't want implicit per-session conversions.",
      },
    ],
  },
  {
    name: "no-money-type",
    description: "Forbid the money column type.",
    longDescription:
      "The `money` type's output depends on the server's `lc_monetary` locale setting, so the same row prints differently on different servers. The PostgreSQL recommendation is `numeric` plus a separate currency column.",
    type: "problem",
    recommended: "error",
    fixable: false,
    category: "schema",
    incorrect: ["CREATE TABLE t (price MONEY);"],
    correct: ["CREATE TABLE t (price NUMERIC(10, 2), currency CHAR(3));"],
  },
  {
    name: "no-char-type",
    description: "Avoid CHAR(n) — it pads on write and trims on read.",
    longDescription:
      "PostgreSQL pads stored `char(n)` values to `n` with trailing spaces and silently trims them on read. The padding surprises comparisons and sorts. Use `text` (and a `CHECK` constraint when you need a length).",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "schema",
    incorrect: [
      "CREATE TABLE t (code CHAR(3));",
      "CREATE TABLE t (code BPCHAR(3));",
    ],
    correct: [
      "CREATE TABLE t (code TEXT);",
      "CREATE TABLE t (code TEXT CHECK (length(code) = 3));",
    ],
  },
  {
    name: "no-grant-to-public",
    description: "Avoid GRANT ... TO PUBLIC.",
    longDescription:
      "The PUBLIC pseudo-role covers every current and future role in the database. Privilege grants should name roles explicitly. `REVOKE ... FROM PUBLIC` is unaffected — revoking implicit grants is good hygiene.",
    type: "problem",
    recommended: "warn",
    fixable: false,
    category: "security",
    incorrect: ["GRANT SELECT ON users TO PUBLIC;"],
    correct: [
      "GRANT SELECT ON users TO reporting;",
      "REVOKE ALL ON users FROM PUBLIC;",
    ],
  },
  {
    name: "consistent-create-index-concurrently",
    description:
      "Enforce a consistent stance on `CONCURRENTLY` for `CREATE INDEX`.",
    longDescription:
      "Two valid stances exist: (a) always use `CREATE INDEX CONCURRENTLY` so the build avoids the table-level `SHARE` lock and doesn't block writers, or (b) never use it so each `CREATE INDEX` can run inside a migration transaction. Pick one with the `style` option. Off by default because the right answer depends on your migration framework.",
    type: "suggestion",
    recommended: "off",
    fixable: false,
    category: "perf",
    incorrect: ["CREATE INDEX idx_users_email ON users (email);"],
    correct: ["CREATE INDEX CONCURRENTLY idx_users_email ON users (email);"],
    options: [
      {
        name: "style",
        type: '"always" | "never"',
        default: '"always"',
        description:
          "Which stance to enforce. `always` (default) requires `CONCURRENTLY` so the build doesn't block writers. `never` forbids it so each `CREATE INDEX` can run inside a migration transaction.",
      },
    ],
  },
  {
    name: "no-not-in-subquery",
    description: "Disallow NOT IN (subquery) — NULL handling is a trap.",
    longDescription:
      "`NOT IN` against a subquery returns **no rows** if the subquery yields a single NULL. Semantically correct under three-valued logic, virtually never what application code wants. Use `NOT EXISTS (...)` instead. `NOT IN (1, 2, 3)` with a literal list is unaffected.",
    type: "problem",
    recommended: "error",
    fixable: false,
    category: "safety",
    incorrect: [
      "SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM blocks);",
    ],
    correct: [
      "SELECT id FROM users u\nWHERE NOT EXISTS (SELECT 1 FROM blocks b WHERE b.user_id = u.id);",
      "SELECT 1 FROM users WHERE id NOT IN (1, 2, 3); -- literal list is fine",
    ],
  },
  {
    name: "snake-case-table-name",
    description: "Require snake_case table names.",
    longDescription:
      'Quoted mixed-case identifiers (`"UserAccounts"`) preserve their case and force every caller to quote them — a steady source of `relation does not exist` errors. Unquoted `CamelCase` is silently lowercased by PostgreSQL and passes the rule.',
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "style",
    incorrect: ['CREATE TABLE "UserAccounts" (id INT PRIMARY KEY);'],
    correct: [
      "CREATE TABLE user_accounts (id INT PRIMARY KEY);",
      "CREATE TABLE UserAccounts (id INT PRIMARY KEY); -- folded to useraccounts",
    ],
    options: [
      {
        name: "allow",
        type: "string[]",
        default: "[]",
        description:
          "Identifiers to exempt from the rule. Useful for tables that must keep an external name (e.g. `KEYWORDS`, vendor schemas).",
      },
    ],
  },
  {
    name: "snake-case-column-name",
    description: "Require snake_case column names.",
    longDescription:
      'Same rationale as `snake-case-table-name`: quoted `"CamelCol"` forces every caller to quote-match the name, while unquoted `CamelCol` is silently lowercased to `camelcol`.',
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "style",
    incorrect: ['CREATE TABLE t ("CamelCol" INT);'],
    correct: [
      "CREATE TABLE t (camel_col INT);",
      "CREATE TABLE t (CamelCol INT); -- folded to camelcol",
    ],
    options: [
      {
        name: "allow",
        type: "string[]",
        default: "[]",
        description:
          "Column names to exempt from the rule (e.g. `id`, `createdAt` for an existing schema mid-migration).",
      },
    ],
  },
  {
    name: "no-implicit-join",
    description: "Avoid implicit (comma) joins.",
    longDescription:
      "`SELECT ... FROM a, b WHERE ...` is an implicit cross join whose join condition is buried in `WHERE`. Forget the condition and you silently get a cartesian product. Explicit `JOIN ... ON ...` puts the join condition next to the join.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "style",
    incorrect: ["SELECT a.id FROM a, b WHERE a.id = b.id;"],
    correct: ["SELECT a.id FROM a JOIN b ON a.id = b.id;"],
  },
  {
    name: "require-limit",
    description: "Require a LIMIT clause on SELECT.",
    longDescription:
      "Defends against accidentally pulling the entire table over the wire. Best applied to ad-hoc query files; report-style queries that intentionally aggregate everything will fight the rule and should disable it locally.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "perf",
    incorrect: [
      "SELECT * FROM users;",
      "SELECT name, email FROM users WHERE active = true;",
    ],
    correct: [
      "SELECT * FROM users LIMIT 100;",
      "SELECT name, email FROM users WHERE active = true LIMIT 50;",
    ],
  },
  {
    name: "no-order-by-ordinal",
    description:
      "Disallow positional `ORDER BY` references (e.g., `ORDER BY 1`).",
    longDescription:
      "`ORDER BY 1, 2` silently changes meaning when the SELECT list is reordered or a column is inserted. Worse, the intent is invisible at any callsite that consumes the query via a view or CTE. Reference columns by name or by an alias.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "style",
    incorrect: [
      "SELECT id, name FROM users ORDER BY 1;",
      "SELECT id, name, email FROM users ORDER BY 1, 2 DESC;",
    ],
    correct: [
      "SELECT id, name FROM users ORDER BY name;",
      "SELECT id, name AS display_name FROM users ORDER BY display_name;",
    ],
  },
  {
    name: "no-group-by-ordinal",
    description:
      "Disallow positional `GROUP BY` references (e.g., `GROUP BY 1`).",
    longDescription:
      "Same fragility as positional `ORDER BY`: reordering the SELECT list silently shifts the grouping to a different column, producing plausible-looking but wrong aggregates. Reference the column by name or by the grouping expression.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "style",
    incorrect: [
      "SELECT category, count(*) FROM items GROUP BY 1;",
      "SELECT region, category, sum(amount) FROM sales GROUP BY 1, 2;",
    ],
    correct: [
      "SELECT category, count(*) FROM items GROUP BY category;",
      "SELECT region, category, sum(amount) FROM sales GROUP BY region, category;",
    ],
  },
  {
    name: "no-distinct-on-without-order-by",
    description:
      "Require ORDER BY alongside `SELECT DISTINCT ON (...)` so the surviving row is deterministic.",
    longDescription:
      "Without `ORDER BY`, PostgreSQL keeps an arbitrary row from each group of `DISTINCT ON` — the result depends on scan order and changes silently across plan or stats updates. Pair `DISTINCT ON` with an `ORDER BY` whose leading columns match.",
    type: "problem",
    recommended: "error",
    fixable: false,
    category: "safety",
    incorrect: [
      "SELECT DISTINCT ON (customer_id) customer_id, amount FROM orders;",
    ],
    correct: [
      "SELECT DISTINCT ON (customer_id) customer_id, amount\nFROM orders\nORDER BY customer_id, created_at DESC;",
      "SELECT DISTINCT customer_id FROM orders;",
    ],
  },
  {
    name: "no-leading-wildcard-like",
    description:
      "Warn on `LIKE`/`ILIKE` patterns that begin with `%`; they force sequential scans.",
    longDescription:
      "A pattern like `'%foo'` or `'%foo%'` cannot use a plain B-tree index and forces PostgreSQL into a sequential scan. Use a `pg_trgm` GIN index or full-text search if substring matching is required.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "perf",
    incorrect: [
      "SELECT id FROM users WHERE email LIKE '%@example.com';",
      "SELECT id FROM users WHERE name ILIKE '%smith%';",
    ],
    correct: [
      "SELECT id FROM users WHERE email LIKE 'admin@%';",
      "SELECT id FROM users WHERE email = 'admin@example.com';",
    ],
  },
  {
    name: "no-add-column-not-null-without-default",
    description:
      "Error on `ADD COLUMN ... NOT NULL` without a `DEFAULT` — fails on non-empty tables.",
    longDescription:
      "On any table that already has rows, `ALTER TABLE ADD COLUMN ... NOT NULL` aborts because existing rows have no value for the new column. Supply a `DEFAULT`, or add the column nullable, backfill, then `SET NOT NULL`.",
    type: "problem",
    recommended: "error",
    fixable: false,
    category: "safety",
    incorrect: ["ALTER TABLE users ADD COLUMN status text NOT NULL;"],
    correct: [
      "ALTER TABLE users ADD COLUMN status text NOT NULL DEFAULT 'active';",
      "ALTER TABLE users ADD COLUMN status text;",
    ],
  },
  {
    name: "no-select-into",
    description:
      "Disallow `SELECT ... INTO target FROM ...`; prefer `CREATE TABLE AS SELECT`.",
    longDescription:
      "`SELECT ... INTO target` silently creates a new table. The syntax is confusable with PL/pgSQL's `SELECT INTO variable` and is omitted from most SQL primers. `CREATE TABLE target AS SELECT ...` reads back as the intent.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "style",
    incorrect: [
      "SELECT id, name INTO archived_users FROM users WHERE inactive;",
    ],
    correct: [
      "CREATE TABLE archived_users AS SELECT id, name FROM users WHERE inactive;",
    ],
  },
  {
    name: "prefer-coalesce-over-case",
    description:
      "Flag `CASE WHEN x IS NULL THEN y ELSE x END` and recommend `COALESCE(x, y)`.",
    longDescription:
      "`COALESCE` is shorter, evaluates `x` once, and is the form every PostgreSQL planner optimizes directly. Also catches the mirrored `IS NOT NULL` form. Multi-arm CASEs that go beyond a single null-fallback are not flagged.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "style",
    incorrect: [
      "SELECT CASE WHEN nickname IS NULL THEN full_name ELSE nickname END FROM users;",
      "SELECT CASE WHEN nickname IS NOT NULL THEN nickname ELSE full_name END FROM users;",
    ],
    correct: ["SELECT COALESCE(nickname, full_name) FROM users;"],
  },
  {
    name: "no-having-without-group-by",
    description:
      "Disallow `HAVING` without `GROUP BY`; the predicate belongs in `WHERE`.",
    longDescription:
      "PostgreSQL accepts `HAVING` without `GROUP BY` and collapses the query to a single aggregate row over the whole table — almost never what the author meant. If the predicate is row-level, put it in `WHERE`. If it's aggregate-level, add a `GROUP BY`.",
    type: "problem",
    recommended: "error",
    fixable: false,
    category: "safety",
    incorrect: ["SELECT count(*) FROM users HAVING count(*) > 1;"],
    correct: [
      "SELECT category, count(*) FROM items GROUP BY category HAVING count(*) > 1;",
      "SELECT count(*) FROM users WHERE active;",
    ],
  },
  {
    name: "no-alter-column-type",
    description:
      "Warn on `ALTER COLUMN ... TYPE` — can rewrite the table under ACCESS EXCLUSIVE.",
    longDescription:
      "PostgreSQL may need to rewrite every row (and every index) under an `ACCESS EXCLUSIVE` lock to change a column's type. For non-trivial tables, add a new column, dual-write, backfill, and swap — or wrap the conversion in a separate, scheduled migration.",
    type: "problem",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: ["ALTER TABLE users ALTER COLUMN id TYPE bigint;"],
    correct: [
      "ALTER TABLE users ADD COLUMN id_new bigint;",
      "ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';",
    ],
  },
  {
    name: "no-rename-column",
    description:
      "Warn on `RENAME COLUMN` — breaks deployed code reading the old name.",
    longDescription:
      "The rename completes atomically in the database, but every running app instance that still references the old name starts erroring the moment the migration runs. Use add → dual-write → backfill → drop across separate deploys.",
    type: "problem",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: ["ALTER TABLE users RENAME COLUMN email_address TO email;"],
    correct: ["ALTER TABLE users ADD COLUMN email text;"],
  },
  {
    name: "no-rename-table",
    description:
      "Warn on `RENAME TO` — breaks deployed code reading the old name.",
    longDescription:
      "Renaming a table is fast in the database but breaks every running app that still queries the old name. Keep the old table accessible via a view until callers are migrated, then drop it in a separate deploy.",
    type: "problem",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: ["ALTER TABLE legacy_users RENAME TO users;"],
    correct: ["CREATE TABLE users (id BIGINT PRIMARY KEY);"],
  },
  {
    name: "no-drop-column",
    description:
      "Warn on `DROP COLUMN` — breaks every reader still referencing the column.",
    longDescription:
      "Every running app instance that still reads the column starts failing the moment the migration runs. The safe pattern is to stop reading/writing the column in the application, deploy, then drop it in a follow-up migration.",
    type: "problem",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: ["ALTER TABLE users DROP COLUMN legacy_flag;"],
    correct: ["ALTER TABLE users ADD COLUMN status text;"],
  },
  {
    name: "no-drop-not-null",
    description:
      "Warn on `DROP NOT NULL` — surprises consumers that already assume non-null.",
    longDescription:
      "Relaxing the constraint lets the column store NULLs again. Every reader that already assumes the column is non-null (joins, COALESCE coverage, app-level types) silently breaks. Model the truly optional case explicitly instead.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: ["ALTER TABLE users ALTER COLUMN email DROP NOT NULL;"],
    correct: ["ALTER TABLE users ALTER COLUMN status DROP DEFAULT;"],
  },
  {
    name: "consistent-fk-not-valid",
    description:
      "Enforce a consistent stance on `NOT VALID` for `ALTER TABLE ... ADD FOREIGN KEY`.",
    longDescription:
      "Adding a foreign key normally validates every existing row under an `ACCESS EXCLUSIVE` lock that blocks writers. The safe pattern is to `ADD ... NOT VALID` (metadata-only) and then `VALIDATE CONSTRAINT` in a separate migration; `VALIDATE` only takes a `SHARE UPDATE EXCLUSIVE` lock. Some projects prefer the inverse — fail loudly at constraint-add time — and can flip this rule with the `style` option.",
    type: "problem",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: [
      "ALTER TABLE orders\n  ADD CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id) REFERENCES customers (id);",
    ],
    correct: [
      "ALTER TABLE orders\n  ADD CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id) REFERENCES customers (id) NOT VALID;",
      "ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_fk;",
    ],
    options: [
      {
        name: "style",
        type: '"always" | "never"',
        default: '"always"',
        description:
          "`always` (default) requires `NOT VALID` on `ADD CONSTRAINT ... FOREIGN KEY`. `never` forbids it — useful for projects that want the constraint to immediately reject existing violations rather than waiting on a follow-up `VALIDATE CONSTRAINT`.",
      },
    ],
  },
  {
    name: "require-named-constraint",
    description:
      "Require explicit names on CHECK / UNIQUE / FK / EXCLUSION constraints.",
    longDescription:
      "PostgreSQL invents a name for unnamed constraints, but the generated name varies subtly across environments and migration tools, which makes later `DROP CONSTRAINT` / `ALTER CONSTRAINT` statements brittle. Column-level `NOT NULL` and `PRIMARY KEY` are allowed without explicit names.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "schema",
    incorrect: [
      "CREATE TABLE items (id int, code text, UNIQUE (code));",
      "ALTER TABLE items ADD CHECK (length(code) > 0);",
    ],
    correct: [
      "CREATE TABLE items (\n  id int,\n  code text,\n  CONSTRAINT items_code_unique UNIQUE (code)\n);",
      "ALTER TABLE items ADD CONSTRAINT items_code_non_empty CHECK (length(code) > 0);",
    ],
  },
  {
    name: "no-unlogged-table",
    description:
      "Warn on `CREATE UNLOGGED TABLE` — data is lost on crash and not replicated.",
    longDescription:
      "`UNLOGGED` tables skip WAL: truncated on crash, not replicated to standbys, not restored from base backups. If a cache-style table is genuinely what you want, document it and disable the rule on that file.",
    type: "problem",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: ["CREATE UNLOGGED TABLE session_cache (id text PRIMARY KEY);"],
    correct: ["CREATE TABLE session_cache (id text PRIMARY KEY);"],
  },
  {
    name: "no-temporary-table",
    description: "Warn on `CREATE TEMP / TEMPORARY TABLE` in versioned SQL.",
    longDescription:
      "Temporary tables exist only for the current session, so they almost never belong in versioned SQL. If session-scoped scratch storage is required, build it from application code.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: ["CREATE TEMP TABLE staging (id int);"],
    correct: ["CREATE TABLE staging (id int);"],
  },
  {
    name: "no-numeric-without-precision",
    description:
      "Require an explicit precision and scale on `NUMERIC` / `DECIMAL` columns.",
    longDescription:
      "Bare `NUMERIC` accepts unbounded magnitude — useful only if you really do mean 'arbitrary precision', which is rarely the case in application schemas. Declare `NUMERIC(precision, scale)` so the column documents its domain.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "schema",
    incorrect: [
      "CREATE TABLE products (price numeric);",
      "CREATE TABLE products (price decimal);",
    ],
    correct: ["CREATE TABLE products (price numeric(10, 2));"],
  },
  {
    name: "no-time-type",
    description:
      "Disallow `TIME` / `TIMETZ` columns; they rarely model real values correctly.",
    longDescription:
      "`time` has no date so cannot disambiguate around DST transitions; `timetz` stores an offset that is meaningless without a date. Use `timestamptz` for points in time, `interval` for durations, or `text` if all you need is a display value.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "schema",
    incorrect: [
      "CREATE TABLE shifts (id int, start_at time);",
      "CREATE TABLE shifts (id int, start_at timetz);",
    ],
    correct: [
      "CREATE TABLE shifts (id int, start_at timestamptz);",
      "CREATE TABLE jobs (id int, duration interval);",
    ],
  },
  {
    name: "no-set-not-null",
    description: "Warn on `SET NOT NULL` — full scan under ACCESS EXCLUSIVE.",
    longDescription:
      "PostgreSQL scans the whole table to verify no nulls, holding `ACCESS EXCLUSIVE` for the duration. The PG ≥ 12 pattern is `ADD CHECK (col IS NOT NULL) NOT VALID` → `VALIDATE CONSTRAINT` → `SET NOT NULL` (PG reuses the validated CHECK and skips the scan).",
    type: "problem",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: ["ALTER TABLE users ALTER COLUMN email SET NOT NULL;"],
    correct: [
      "ALTER TABLE users ADD CONSTRAINT users_email_not_null CHECK (email IS NOT NULL) NOT VALID;",
      "ALTER TABLE users VALIDATE CONSTRAINT users_email_not_null;",
    ],
  },
  {
    name: "no-set-search-path",
    description:
      "Disallow `SET search_path` in versioned SQL; qualify identifiers instead.",
    longDescription:
      "`SET search_path` makes name resolution depend on session state — a known footgun for SECURITY DEFINER functions and `CREATE TABLE foo` statements that silently target a different schema. Qualify identifiers (`audit.events`, `public.users`) instead.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: ["SET search_path TO audit, public;"],
    correct: ["SELECT id FROM audit.events;"],
  },
  {
    name: "require-schema-qualified-table",
    description: "Require schema-qualified `CREATE TABLE` (off by default).",
    longDescription:
      "`CREATE TABLE foo` resolves through `search_path` and may land in an unintended schema. This rule is off by default in `configs.recommended` because many projects intentionally keep everything in `public`; enable it explicitly when you organize by schema.",
    type: "suggestion",
    recommended: "off",
    fixable: false,
    category: "schema",
    incorrect: ["CREATE TABLE users (id bigint PRIMARY KEY);"],
    correct: ["CREATE TABLE app.users (id bigint PRIMARY KEY);"],
  },
  {
    name: "prefer-explicit-null-ordering",
    description:
      "Require `NULLS FIRST/LAST` when an explicit ORDER BY direction is used.",
    longDescription:
      "PostgreSQL's null-ordering defaults (NULLS LAST for ASC, NULLS FIRST for DESC) match the SQL spec but contradict every other major engine. Adding explicit `NULLS FIRST/LAST` removes the surprise and survives copy-paste into other databases.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "style",
    incorrect: ["SELECT id FROM users ORDER BY created_at DESC;"],
    correct: [
      "SELECT id FROM users ORDER BY created_at DESC NULLS LAST;",
      "SELECT id FROM users ORDER BY created_at;",
    ],
  },
  {
    name: "no-vacuum-full",
    description:
      "Warn on `VACUUM FULL` — takes ACCESS EXCLUSIVE and rewrites the table.",
    longDescription:
      "`VACUUM FULL` takes `ACCESS EXCLUSIVE` and rewrites the whole table, making it unavailable for the duration. For shrinking a bloated table on a live database use `pg_repack` or `pg_squeeze`; a plain `VACUUM` is fine.",
    type: "problem",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: ["VACUUM FULL users;"],
    correct: ["VACUUM users;", "VACUUM ANALYZE users;"],
  },
  {
    name: "no-cluster",
    description:
      "Warn on `CLUSTER` — ACCESS EXCLUSIVE lock, and PG doesn't maintain the order.",
    longDescription:
      "`CLUSTER` takes `ACCESS EXCLUSIVE` and rewrites the whole table just like `VACUUM FULL`. PostgreSQL does not keep rows clustered as you continue to write, so every subsequent `CLUSTER` must rewrite everything again. Use `pg_repack --order-by` for online clustering.",
    type: "problem",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: ["CLUSTER users USING users_pkey;"],
    correct: ["VACUUM users;"],
  },
  {
    name: "no-drop-database",
    description:
      "Error on `DROP DATABASE` — catastrophic and belongs to an operator workflow.",
    longDescription:
      "Database creation/deletion is not a normal migration step. The operation is catastrophic and irreversible; require it to be run from an operator console with explicit confirmation, not from versioned SQL.",
    type: "problem",
    recommended: "error",
    fixable: false,
    category: "safety",
    incorrect: ["DROP DATABASE archive_2023;"],
    correct: ["DROP TABLE archive;"],
  },
  {
    name: "no-drop-schema-cascade",
    description:
      "Warn on `DROP SCHEMA ... CASCADE` — removes every object in the schema with no preview.",
    longDescription:
      "Same anti-pattern as `DROP TABLE CASCADE` but with a much larger blast radius. Either list the objects you actually want to drop, or drop the schema only when it is already empty.",
    type: "problem",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: ["DROP SCHEMA staging CASCADE;"],
    correct: ["DROP SCHEMA staging;", "DROP SCHEMA staging RESTRICT;"],
  },
  {
    name: "consistent-reindex-concurrently",
    description: "Enforce a consistent stance on `CONCURRENTLY` for `REINDEX`.",
    longDescription:
      "Non-concurrent `REINDEX TABLE` takes a `SHARE` lock that blocks writers for the duration; `REINDEX INDEX` takes `ACCESS EXCLUSIVE`. PG ≥ 12 introduced `REINDEX (...) CONCURRENTLY`, which builds a parallel index and swaps without blocking writers. The `never` style is for migration tools that wrap each step in `BEGIN`/`COMMIT` — `CONCURRENTLY` cannot run inside a transaction.",
    type: "problem",
    recommended: "warn",
    fixable: false,
    category: "perf",
    incorrect: ["REINDEX TABLE users;"],
    correct: ["REINDEX TABLE CONCURRENTLY users;"],
    options: [
      {
        name: "style",
        type: '"always" | "never"',
        default: '"always"',
        description:
          "`always` (default) requires `CONCURRENTLY`. `never` forbids it so each `REINDEX` can run inside a migration transaction.",
      },
    ],
  },
  {
    name: "no-create-role",
    description: "Disallow `CREATE ROLE` / `CREATE USER` in versioned SQL.",
    longDescription:
      "Roles and credentials belong in an operator-managed bootstrap, not in application migrations that run automatically. Granting privileges to existing roles from a migration is fine.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "security",
    incorrect: ["CREATE ROLE app_writer LOGIN PASSWORD 'redacted';"],
    correct: ["GRANT SELECT ON users TO app_reader;"],
  },
  {
    name: "prefer-bigint-id",
    description:
      "Prefer `bigint` for primary-key `id` columns; `int` overflows at 2.1B rows.",
    longDescription:
      "An `int` primary key overflows at ~2.1 billion rows. Widening the type later requires a table rewrite under `ACCESS EXCLUSIVE`. Declare the primary key as `bigint GENERATED ALWAYS AS IDENTITY` from the start. UUID primary keys and non-PK `id` columns are not flagged.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "schema",
    incorrect: [
      "CREATE TABLE users (id int PRIMARY KEY, name text);",
      "CREATE TABLE users (id serial PRIMARY KEY, name text);",
      "CREATE TABLE users (id int, name text, PRIMARY KEY (id));",
    ],
    correct: [
      "CREATE TABLE users (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name text);",
      "CREATE TABLE users (id uuid PRIMARY KEY, name text);",
    ],
  },
  {
    name: "align-column-definitions",
    description: "Align column definitions vertically inside `CREATE TABLE`.",
    longDescription:
      "Aligns the name, type, and constraint columns of every `ColumnDef` row inside a `CREATE TABLE`. Multi-line column definitions and shared-line layouts are skipped because source surgery is unsafe in those shapes.",
    type: "layout",
    recommended: "off",
    fixable: true,
    category: "style",
    incorrect: [
      `CREATE TABLE t (\n  a TEXT NOT NULL,\n  b non_blank_text_64[] NOT NULL,\n  c INTEGER NOT NULL\n);`,
    ],
    correct: [
      `CREATE TABLE t (\n  a  TEXT                  NOT NULL,\n  b  non_blank_text_64[]   NOT NULL,\n  c  INTEGER               NOT NULL\n);`,
    ],
    options: [
      {
        name: "gap",
        type: "integer (>= 1)",
        default: 2,
        description: "Number of spaces to leave between aligned columns.",
      },
    ],
  },
  {
    name: "align-values",
    description:
      "Align column values vertically inside multi-row `INSERT ... VALUES`.",
    longDescription:
      "Each tuple position is padded so that values share a consistent width across rows. Single-row `VALUES` lists are skipped — the rule only kicks in when there are multiple rows to align.",
    type: "layout",
    recommended: "off",
    fixable: true,
    category: "style",
    incorrect: [
      `INSERT INTO t (a, b, c) VALUES\n  ('GPT-5',                 1.25, CURRENT_TIMESTAMP),\n  ('Claude',                5,    CURRENT_TIMESTAMP),\n  ('Haiku',                 1,    CURRENT_TIMESTAMP);`,
    ],
    correct: [
      `INSERT INTO t (a, b, c) VALUES\n  ('GPT-5',  1.25, CURRENT_TIMESTAMP),\n  ('Claude', 5,    CURRENT_TIMESTAMP);`,
    ],
    options: [
      {
        name: "gap",
        type: "integer (>= 1)",
        default: 1,
        description:
          "Minimum number of spaces between aligned tuple positions.",
      },
    ],
  },
  {
    name: "no-equality-with-null",
    description:
      "Disallow `x = NULL` / `x <> NULL`; use `IS NULL` / `IS NOT NULL`.",
    longDescription:
      "Comparing with `NULL` using `=`, `<>`, or `!=` always returns NULL (not true), so the predicate silently filters every row. Use the three-valued-logic-aware `IS NULL` / `IS NOT NULL` instead.",
    type: "problem",
    recommended: "error",
    fixable: false,
    category: "safety",
    incorrect: [
      "SELECT * FROM t WHERE x = NULL;",
      "SELECT * FROM t WHERE x <> NULL;",
      "SELECT * FROM t WHERE NULL = x;",
    ],
    correct: [
      "SELECT * FROM t WHERE x IS NULL;",
      "SELECT * FROM t WHERE x IS NOT NULL;",
    ],
  },
  {
    name: "no-on-delete-cascade",
    description: "Disallow `ON DELETE CASCADE` on foreign keys.",
    longDescription:
      "`ON DELETE CASCADE` makes a single `DELETE` quietly recurse through dependent tables. Prefer `RESTRICT` / `NO ACTION` / `SET NULL` and explicit deletion code paths so deletions are visible at the call site.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: [
      "CREATE TABLE t (\n  fid integer REFERENCES other(id) ON DELETE CASCADE\n);",
      "ALTER TABLE t ADD CONSTRAINT fk FOREIGN KEY (fid) REFERENCES other(id) ON DELETE CASCADE;",
    ],
    correct: [
      "CREATE TABLE t (\n  fid integer REFERENCES other(id) ON DELETE RESTRICT\n);",
      "ALTER TABLE t ADD CONSTRAINT fk FOREIGN KEY (fid) REFERENCES other(id) ON DELETE NO ACTION;",
    ],
  },
  {
    name: "no-rule",
    description:
      "Disallow `CREATE RULE`; it is effectively deprecated in favor of triggers and updatable views.",
    longDescription:
      "`CREATE RULE` rewrites the query tree at planning time, which interacts poorly with prepared statements, COPY, and partitioning. The PostgreSQL community considers the rule system effectively deprecated; use a trigger or an updatable view instead.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: ["CREATE RULE noop AS ON UPDATE TO t DO INSTEAD NOTHING;"],
    correct: [
      "CREATE TRIGGER t_trg BEFORE UPDATE ON t FOR EACH ROW EXECUTE FUNCTION t_trg_fn();",
      "CREATE VIEW v AS SELECT * FROM t;",
    ],
  },
  {
    name: "no-security-definer-without-search-path",
    description:
      "Disallow `SECURITY DEFINER` functions without an explicit `SET search_path`.",
    longDescription:
      "A `SECURITY DEFINER` function runs with the owner's privileges. If the caller controls `search_path`, they can shadow built-ins (e.g. `pg_catalog.lower`) with their own functions and execute code as the owner — a recurring CVE pattern. Pin `search_path` (e.g. `SET search_path = pg_catalog, pg_temp`) on every `SECURITY DEFINER` function. `SECURITY INVOKER` (the default) is out of scope.",
    type: "problem",
    recommended: "error",
    fixable: false,
    category: "security",
    incorrect: [
      "CREATE FUNCTION fn() RETURNS void\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$ BEGIN END $$;",
    ],
    correct: [
      "CREATE FUNCTION fn() RETURNS void\nLANGUAGE plpgsql\nSECURITY DEFINER\nSET search_path = pg_catalog, pg_temp\nAS $$ BEGIN END $$;",
    ],
  },
  {
    name: "no-unnecessary-quoted-identifier",
    description:
      'Disallow `"..."` around identifiers that don\'t need quoting.',
    longDescription:
      "Quoting identifiers that don't require it (no reserved-word collision, no mixed case, no embedded characters) just adds noise. PostgreSQL folds bare identifiers to lower case but preserves quoted ones, so quoted identifiers also force every consumer to quote-match the name. Reserved words, mixed-case identifiers, and identifiers containing special characters are left alone.",
    type: "suggestion",
    recommended: "off",
    fixable: true,
    category: "style",
    incorrect: ['SELECT "id", "name" FROM "users" WHERE "active" = TRUE;'],
    correct: [
      "SELECT id, name FROM users WHERE active = TRUE;",
      'SELECT "select" FROM users; -- reserved keyword: must stay quoted',
      'SELECT "MyColumn" FROM "MyTable"; -- mixed case: must stay quoted',
    ],
  },
  {
    name: "no-update-primary-key",
    description: "Disallow `UPDATE` on primary-key columns (heuristic).",
    longDescription:
      "Primary keys are intended to be immutable: foreign-key references and external systems may hold the old value. By default the rule treats `id` and `<table>_id` as primary-key columns; override with `pkColumnNames` for non-conventional schemas.",
    type: "problem",
    recommended: "error",
    fixable: false,
    category: "safety",
    incorrect: ["UPDATE users SET id = 5 WHERE id = 1;"],
    correct: [
      "UPDATE users SET name = 'foo' WHERE id = 1;",
      "UPDATE orders SET total = 100, status = 'paid' WHERE id = 2;",
    ],
    options: [
      {
        name: "pkColumnNames",
        type: "string[]",
        default: '["id"]',
        description:
          "Explicit list of primary-key column names. Replaces the default. The `<table>_id` heuristic still applies in addition.",
      },
    ],
  },
  {
    name: "no-update-without-from-binding",
    description:
      "Disallow `UPDATE ... FROM` without a `WHERE` (Cartesian product).",
    longDescription:
      "An `UPDATE ... FROM other_table` without a `WHERE` joins every row of the target with every row of the source, then keeps the last assignment per target row. The result is almost never what the author meant. Plain `UPDATE` (no `FROM`) is out of scope — see `require-where-in-update`.",
    type: "problem",
    recommended: "error",
    fixable: false,
    category: "safety",
    incorrect: ["UPDATE t SET x = u.x FROM u;"],
    correct: ["UPDATE t SET x = u.x FROM u WHERE t.id = u.t_id;"],
  },
  {
    name: "no-with-recursive-without-limit",
    description: "Disallow `WITH RECURSIVE` without an outer `LIMIT`.",
    longDescription:
      "A `WITH RECURSIVE` query without a terminating `LIMIT` can run unbounded if a join condition is wrong or a base case is missing. Adding an outer `LIMIT` puts a hard ceiling on the rows produced.",
    type: "problem",
    recommended: "error",
    fixable: false,
    category: "safety",
    incorrect: [
      `WITH RECURSIVE r AS (\n  SELECT 1 AS n\n  UNION ALL\n  SELECT n + 1 FROM r\n) SELECT * FROM r;`,
    ],
    correct: [
      `WITH RECURSIVE r AS (\n  SELECT 1 AS n\n  UNION ALL\n  SELECT n + 1 FROM r\n) SELECT * FROM r LIMIT 10;`,
    ],
  },
  {
    name: "plpgsql-keyword-case",
    description:
      "Enforce a consistent case for SQL/PL/pgSQL keywords inside PL/pgSQL bodies.",
    longDescription:
      "Applies only inside `LANGUAGE plpgsql` bodies (other languages are left alone). String literals, dollar-quoted strings, and comments are skipped.",
    type: "layout",
    recommended: "off",
    fixable: true,
    category: "style",
    incorrect: [
      `CREATE FUNCTION foo() RETURNS void AS $$\ndeclare\n  user_count integer;\nbegin\n  if user_count is null then\n    raise notice 'hello';\n  end if;\nend;\n$$ LANGUAGE plpgsql;`,
    ],
    correct: [
      `CREATE FUNCTION foo() RETURNS void AS $$\nDECLARE\n  user_count integer;\nBEGIN\n  IF user_count IS NULL THEN\n    RAISE NOTICE 'hello';\n  END IF;\nEND;\n$$ LANGUAGE plpgsql;`,
    ],
    options: [
      {
        name: "case",
        type: '"upper" | "lower"',
        default: '"upper"',
        description: "Target case for PL/pgSQL keywords.",
      },
    ],
  },
  {
    name: "prefer-add-constraint-not-valid",
    description:
      "Prefer `ADD CONSTRAINT ... NOT VALID` then `VALIDATE CONSTRAINT`.",
    longDescription:
      "Adding a `CHECK` or foreign-key constraint without `NOT VALID` validates every existing row inside an `ACCESS EXCLUSIVE` lock — fine on small tables, an outage on large ones. The two-step pattern (add `NOT VALID`, then `VALIDATE CONSTRAINT` in a separate transaction) holds only a `SHARE UPDATE EXCLUSIVE` lock during validation. `PRIMARY KEY`, `UNIQUE`, and `NOT NULL` are out of scope (they don't accept `NOT VALID`).",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: [
      "ALTER TABLE t ADD CONSTRAINT c_check CHECK (x > 0);",
      "ALTER TABLE t ADD CONSTRAINT c_fk FOREIGN KEY (other_id) REFERENCES other(id);",
    ],
    correct: [
      "ALTER TABLE t ADD CONSTRAINT c_check CHECK (x > 0) NOT VALID;",
      "ALTER TABLE t ADD CONSTRAINT c_fk FOREIGN KEY (other_id) REFERENCES other(id) NOT VALID;",
    ],
  },
  {
    name: "consistent-as-for-column-alias",
    description:
      "Enforce a consistent stance on the `AS` keyword before column aliases in `SELECT`.",
    longDescription:
      "PostgreSQL allows `SELECT id user_id`, but the optional `AS` is the SQL-standard form and is far easier to read at a glance — without `AS`, an accidental missing comma silently turns a column into an alias of the previous one. Use the `style` option to enforce either direction.",
    type: "layout",
    recommended: "off",
    fixable: true,
    category: "style",
    incorrect: ["SELECT id user_id, name full_name FROM users;"],
    correct: ["SELECT id AS user_id, name AS full_name FROM users;"],
    options: [
      {
        name: "style",
        type: '"always" | "never"',
        default: '"always"',
        description:
          "`always` (default) requires `AS` before column aliases. `never` forbids the keyword.",
      },
    ],
  },
  {
    name: "consistent-as-for-table-alias",
    description:
      "Enforce a consistent stance on the `AS` keyword before table aliases.",
    longDescription:
      "Same rationale as `consistent-as-for-column-alias`: explicit `AS` makes the alias unmistakable and helps human readers spot stray missing commas in the FROM list. Flip with the `style` option if your project prefers the bare form.",
    type: "layout",
    recommended: "off",
    fixable: true,
    category: "style",
    incorrect: ["SELECT u.id FROM users u WHERE u.active = TRUE;"],
    correct: [
      "SELECT u.id FROM users AS u WHERE u.active = TRUE;",
      "SELECT u.id FROM users WHERE active = TRUE;",
    ],
    options: [
      {
        name: "style",
        type: '"always" | "never"',
        default: '"always"',
        description:
          "`always` (default) requires `AS` before table aliases. `never` forbids the keyword.",
      },
    ],
  },
  {
    name: "consistent-between-over-and",
    description:
      "Enforce a consistent stance on `x BETWEEN a AND b` vs `x >= a AND x <= b`.",
    longDescription:
      "`BETWEEN` is the SQL-standard inclusive-range form and is shorter to read. The rule only flags inclusive comparisons (`>=` / `<=`) where both bounds reference the same expression — strict inequalities are not equivalent to `BETWEEN` and are out of scope. Flip with the `style` option for projects that prefer explicit comparisons.",
    type: "suggestion",
    recommended: "off",
    fixable: true,
    category: "style",
    incorrect: ["SELECT * FROM t WHERE x >= 1 AND x <= 10;"],
    correct: [
      "SELECT * FROM t WHERE x BETWEEN 1 AND 10;",
      "SELECT * FROM t WHERE x > 1 AND x < 10; -- strict bounds: out of scope",
    ],
    options: [
      {
        name: "style",
        type: '"always" | "never"',
        default: '"always"',
        description:
          "`always` (default) rewrites `>=` + `<=` pairs to `BETWEEN`. `never` rewrites `BETWEEN` back to explicit `>=` and `<=` comparisons.",
      },
    ],
  },
  {
    name: "prefer-cast-operator",
    description:
      "Enforce a single style for type casts (`x::int` or `CAST(x AS int)`).",
    longDescription:
      "PostgreSQL accepts both forms; this rule picks one and rewrites the other. Default is the operator form `x::int`. Switch with the `form` option.",
    type: "layout",
    recommended: "off",
    fixable: true,
    category: "style",
    incorrect: [
      "SELECT CAST(x AS integer) FROM t;",
      "SELECT CAST(x AS varchar(255)) FROM t;",
    ],
    correct: ["SELECT x::integer FROM t;", "SELECT x::numeric(10, 2) FROM t;"],
    options: [
      {
        name: "form",
        type: '"operator" | "function"',
        default: '"operator"',
        description:
          "Which form of cast to enforce. `operator` rewrites `CAST(x AS T)` to `x::T`; `function` rewrites the other direction.",
      },
    ],
  },
  {
    name: "consistent-create-or-replace",
    description:
      "Enforce a consistent stance on `CREATE OR REPLACE` for `FUNCTION` / `PROCEDURE` / `VIEW`.",
    longDescription:
      "Two valid stances exist: (a) always use `CREATE OR REPLACE` so re-running a migration is idempotent, or (b) never use it so unintended overwrites are surfaced as `relation already exists`. Pick one with the `style` option; the rule auto-fixes either way. `CREATE TABLE` / `CREATE INDEX` are out of scope (they don't support `OR REPLACE`).",
    type: "suggestion",
    recommended: "off",
    fixable: true,
    category: "safety",
    incorrect: [
      "CREATE FUNCTION fn() RETURNS void LANGUAGE SQL AS '';",
      "CREATE PROCEDURE p() LANGUAGE SQL AS '';",
      "CREATE VIEW v AS SELECT 1;",
    ],
    correct: [
      "CREATE OR REPLACE FUNCTION fn() RETURNS void LANGUAGE SQL AS '';",
      "CREATE OR REPLACE PROCEDURE p() LANGUAGE SQL AS '';",
      "CREATE OR REPLACE VIEW v AS SELECT 1;",
    ],
    options: [
      {
        name: "style",
        type: '"always" | "never"',
        default: '"always"',
        description:
          "Which stance to enforce. `always` (default) requires `OR REPLACE` so re-running is idempotent. `never` forbids `OR REPLACE` so unintended overwrites are surfaced.",
      },
    ],
  },
  {
    name: "prefer-current-timestamp-over-now",
    description:
      "Prefer SQL-standard `CURRENT_TIMESTAMP` over `now()` / `LOCALTIMESTAMP`.",
    longDescription:
      "`CURRENT_TIMESTAMP` is portable across SQL engines, while `now()` is PostgreSQL-only. The rule also flags `LOCALTIMESTAMP` / `LOCALTIME` and rewrites them to `CURRENT_TIMESTAMP` / `CURRENT_TIME` — the `LOCAL*` variants return the timezone-naive `timestamp` / `time` types, which is rarely what application code actually wants.",
    type: "layout",
    recommended: "off",
    fixable: true,
    category: "style",
    incorrect: [
      "INSERT INTO events (created_at) VALUES (now());",
      "SELECT LOCALTIMESTAMP, LOCALTIME FROM t;",
    ],
    correct: [
      "INSERT INTO events (created_at) VALUES (CURRENT_TIMESTAMP);",
      "SELECT CURRENT_TIMESTAMP, CURRENT_TIME FROM t;",
    ],
  },
  {
    name: "consistent-drop-index-concurrently",
    description:
      "Enforce a consistent stance on `CONCURRENTLY` for `DROP INDEX`.",
    longDescription:
      "Plain `DROP INDEX` takes an `ACCESS EXCLUSIVE` lock on the table. `DROP INDEX CONCURRENTLY` waits for current users instead. The `never` style is for migration tools that wrap each step in `BEGIN`/`COMMIT` — concurrent drops cannot run inside a transaction. Non-index `DROP` statements are out of scope.",
    type: "suggestion",
    recommended: "off",
    fixable: false,
    category: "safety",
    incorrect: ["DROP INDEX idx_users;"],
    correct: [
      "DROP INDEX CONCURRENTLY idx_users;",
      "DROP INDEX CONCURRENTLY IF EXISTS idx_orders;",
    ],
    options: [
      {
        name: "style",
        type: '"always" | "never"',
        default: '"always"',
        description:
          "`always` (default) requires `CONCURRENTLY`. `never` forbids it.",
      },
    ],
  },
  {
    name: "consistent-explicit-inner-join",
    description:
      "Enforce a consistent stance on the explicit `INNER` keyword in `INNER JOIN`.",
    longDescription:
      "Bare `JOIN` means `INNER JOIN` in PostgreSQL, but it is the same word that introduces every other join type, so a misread is easy. The `always` style requires the explicit `INNER`; the `never` style removes it. `LEFT JOIN`, `RIGHT JOIN`, `FULL JOIN`, `CROSS JOIN`, and `NATURAL JOIN` are out of scope.",
    type: "layout",
    recommended: "off",
    fixable: true,
    category: "style",
    incorrect: ["SELECT u.id FROM users u JOIN orders o ON o.user_id = u.id;"],
    correct: [
      "SELECT u.id FROM users u INNER JOIN orders o ON o.user_id = u.id;",
    ],
    options: [
      {
        name: "style",
        type: '"always" | "never"',
        default: '"always"',
        description:
          "`always` (default) requires `INNER JOIN`. `never` requires the bare `JOIN` form.",
      },
    ],
  },
  {
    name: "consistent-explicit-outer-join",
    description:
      "Enforce a consistent stance on the explicit `OUTER` keyword in `LEFT/RIGHT/FULL OUTER JOIN`.",
    longDescription:
      "PostgreSQL accepts `LEFT JOIN` as shorthand for `LEFT OUTER JOIN`. The `always` style spells `OUTER` out so the join shape is unmistakable; the `never` style drops `OUTER`. `INNER JOIN` and `CROSS JOIN` are out of scope.",
    type: "layout",
    recommended: "off",
    fixable: true,
    category: "style",
    incorrect: [
      "SELECT u.id FROM users u LEFT JOIN orders o ON o.user_id = u.id;",
      "SELECT u.id FROM users u RIGHT JOIN orders o ON o.user_id = u.id;",
      "SELECT u.id FROM users u FULL JOIN orders o ON o.user_id = u.id;",
    ],
    correct: [
      "SELECT u.id FROM users u LEFT OUTER JOIN orders o ON o.user_id = u.id;",
      "SELECT u.id FROM users u FULL OUTER JOIN orders o ON o.user_id = u.id;",
    ],
    options: [
      {
        name: "style",
        type: '"always" | "never"',
        default: '"always"',
        description:
          "`always` (default) requires the explicit `OUTER`. `never` removes it.",
      },
    ],
  },
  {
    name: "prefer-in-list-over-or",
    description: "Prefer `x IN (a, b, c)` over `x = a OR x = b OR x = c`.",
    longDescription:
      "`IN (...)` is shorter, easier to read, and gives the planner a single set instead of N disjunctions. The rule only collapses chains where every disjunct is an equality on the same left-hand side; mixed predicates are out of scope.",
    type: "suggestion",
    recommended: "off",
    fixable: false,
    category: "style",
    incorrect: ["SELECT * FROM t WHERE x = 1 OR x = 2 OR x = 3;"],
    correct: [
      "SELECT * FROM t WHERE x IN (1, 2, 3);",
      "SELECT * FROM t WHERE x = 1 OR y = 2; -- mixed lhs: not in scope",
    ],
  },
  {
    name: "prefer-keyword-case",
    description: "Enforce a consistent case (upper or lower) for SQL keywords.",
    longDescription:
      "Operates on the SQL keyword tokens emitted by the parser; identifiers, string literals, and comments are left alone. The `types` option separately controls how built-in type names (`int`, `text`, `varchar`) are cased — defaulting to `skip` so user-defined type names like `ulid` (which the rule cannot touch) don't end up case-mismatched against built-ins.",
    type: "layout",
    recommended: "off",
    fixable: true,
    category: "style",
    incorrect: ["select id, name from users where active = true limit 10;"],
    correct: ["SELECT id, name FROM users WHERE active = TRUE LIMIT 10;"],
    options: [
      {
        name: "case",
        type: '"upper" | "lower"',
        default: '"upper"',
        description: "Target case for SQL keywords.",
      },
      {
        name: "types",
        type: '"upper" | "lower" | "skip"',
        default: '"skip"',
        description:
          "How to case built-in type names. `skip` leaves them as written so they don't case-mismatch against user-defined types the rule cannot touch.",
      },
    ],
  },
  {
    name: "prefer-not-equals-operator",
    description:
      "Enforce a single style for the not-equal operator (`<>` or `!=`).",
    longDescription:
      "PostgreSQL accepts both spellings. Default target is the SQL-standard `<>`; switch with the `operator` option.",
    type: "layout",
    recommended: "off",
    fixable: true,
    category: "style",
    incorrect: ["SELECT id FROM users WHERE status != 'inactive';"],
    correct: ["SELECT id FROM users WHERE status <> 'inactive';"],
    options: [
      {
        name: "operator",
        type: '"<>" | "!="',
        default: '"<>"',
        description: "Which not-equal spelling to enforce.",
      },
    ],
  },
  {
    name: "require-if-exists",
    description: "Require `IF EXISTS` on every `DROP` statement.",
    longDescription:
      "An `IF EXISTS` `DROP` is idempotent — re-running the migration after a partial run does not error. Covers `DROP TABLE`, `DROP INDEX`, `DROP FUNCTION`, `DROP TRIGGER`, `DROP DATABASE`, `DROP SCHEMA`, `DROP ROLE`. Other statements are out of scope.",
    type: "suggestion",
    recommended: "off",
    fixable: false,
    category: "safety",
    incorrect: [
      "DROP TABLE foo;",
      "DROP INDEX idx_foo;",
      "DROP FUNCTION fn();",
    ],
    correct: [
      "DROP TABLE IF EXISTS foo;",
      "DROP INDEX IF EXISTS idx_foo;",
      "DROP FUNCTION IF EXISTS fn();",
    ],
  },
  {
    name: "require-on-delete-action",
    description:
      "Require an explicit `ON DELETE` clause on every foreign-key constraint.",
    longDescription:
      "Without `ON DELETE`, the default is `NO ACTION` — but it is rarely the deliberate choice. Forcing the author to write the action makes intent visible at the call site. Covers both inline `REFERENCES` and `ALTER TABLE ADD CONSTRAINT FOREIGN KEY`. With the `allowed` option, the rule additionally fails when the action is not in an opt-in list.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "safety",
    incorrect: [
      "CREATE TABLE t (\n  fid integer REFERENCES other(id)\n);",
      "ALTER TABLE t ADD CONSTRAINT fk FOREIGN KEY (fid) REFERENCES other(id);",
    ],
    correct: [
      "CREATE TABLE t (\n  fid integer REFERENCES other(id) ON DELETE RESTRICT\n);",
      "ALTER TABLE t ADD CONSTRAINT fk FOREIGN KEY (fid) REFERENCES other(id) ON DELETE SET NULL;",
    ],
    options: [
      {
        name: "allowed",
        type: '("CASCADE" | "RESTRICT" | "NO ACTION" | "SET NULL" | "SET DEFAULT")[]',
        description:
          'When set, the rule additionally flags any `ON DELETE` whose action is not in this list. Use it to bake project-wide policy into the rule (e.g. `["RESTRICT", "NO ACTION"]` to forbid cascading deletes).',
      },
    ],
  },
  {
    name: "require-trailing-semicolon",
    description: "Require a trailing `;` after every top-level SQL statement.",
    longDescription:
      "Every top-level statement must end with `;`. The check is file-level: it inspects the trailing token of the source rather than the per-statement range, which avoids the libpg-query quirk where the last statement's `range[1]` can point mid-token.",
    type: "layout",
    recommended: "off",
    fixable: true,
    category: "style",
    incorrect: ["SELECT id FROM users"],
    correct: ["SELECT id FROM users;"],
  },
  {
    name: "no-add-check-constraint-without-not-valid",
    description:
      "Disallow `ADD CONSTRAINT CHECK` without `NOT VALID` (lock-heavy).",
    longDescription:
      "`ALTER TABLE t ADD CONSTRAINT c CHECK (...)` validates every existing row inside an `ACCESS EXCLUSIVE` lock. The two-step pattern (`ADD CONSTRAINT ... NOT VALID` then `VALIDATE CONSTRAINT` in a separate transaction) holds only `SHARE UPDATE EXCLUSIVE` during validation. Non-CHECK constraints are out of scope.",
    type: "problem",
    recommended: "error",
    fixable: false,
    category: "safety",
    incorrect: ["ALTER TABLE t ADD CONSTRAINT c CHECK (x > 0);"],
    correct: [
      "ALTER TABLE t ADD CONSTRAINT c CHECK (x > 0) NOT VALID;\nALTER TABLE t VALIDATE CONSTRAINT c;",
    ],
  },
  {
    name: "no-add-unique-constraint-directly",
    description:
      "Disallow inline `ADD CONSTRAINT UNIQUE`; require `USING INDEX`.",
    longDescription:
      "`ALTER TABLE ... ADD CONSTRAINT ... UNIQUE (...)` builds the unique index inline under `ACCESS EXCLUSIVE`. The lock-friendly form is to build the index out-of-band with `CREATE UNIQUE INDEX CONCURRENTLY`, then promote it via `ADD CONSTRAINT ... UNIQUE USING INDEX <name>`. Non-UNIQUE constraints are out of scope.",
    type: "problem",
    recommended: "error",
    fixable: false,
    category: "safety",
    incorrect: ["ALTER TABLE t ADD CONSTRAINT uq_t_email UNIQUE (email);"],
    correct: [
      "CREATE UNIQUE INDEX CONCURRENTLY idx_t_email ON t (email);\nALTER TABLE t ADD CONSTRAINT uq_t_email UNIQUE USING INDEX idx_t_email;",
    ],
  },
  {
    name: "no-volatile-default-on-add-column",
    description:
      "Disallow `ADD COLUMN ... DEFAULT <volatile>()` (forces full table rewrite).",
    longDescription:
      "PG10+ has a stable-default short-cut: `ADD COLUMN ... DEFAULT <constant or STABLE>` does not rewrite the table. A `VOLATILE` default forces a full table rewrite under `ACCESS EXCLUSIVE`. The rule curates the volatile-function list — `random`, `gen_random_uuid`, `uuid_generate_v1*`, `uuid_generate_v4`, `clock_timestamp`, `timeofday`. STABLE defaults like `now()` / `current_timestamp` are not flagged. One layer of `TypeCast` is unwrapped so `gen_random_uuid()::uuid` is detected.",
    type: "problem",
    recommended: "error",
    fixable: false,
    category: "safety",
    incorrect: [
      "ALTER TABLE t ADD COLUMN x integer DEFAULT random();",
      "ALTER TABLE t ADD COLUMN id uuid DEFAULT gen_random_uuid();",
    ],
    correct: [
      "ALTER TABLE t ADD COLUMN x integer DEFAULT 1;",
      "ALTER TABLE t ADD COLUMN z timestamptz DEFAULT now();",
      "ALTER TABLE t ADD COLUMN id integer; -- no default at all is fine",
    ],
  },
  {
    name: "no-grant-all",
    description: "Disallow `GRANT ALL` (list privileges explicitly).",
    longDescription:
      "`GRANT ALL` silently expands as new privileges are added to PostgreSQL — and to the object class — over time. List the privileges your callers actually need so the access surface is auditable. `REVOKE ALL` is the safe direction and is not flagged.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "security",
    incorrect: ["GRANT ALL ON t TO u;", "GRANT ALL PRIVILEGES ON t TO PUBLIC;"],
    correct: [
      "GRANT SELECT ON t TO u;",
      "GRANT SELECT, INSERT, UPDATE ON t TO u;",
      "REVOKE ALL ON t FROM u; -- REVOKE ALL is the safe direction",
    ],
  },
  {
    name: "prefer-exists-over-in-subquery",
    description: "Prefer `EXISTS (subquery)` over `column IN (subquery)`.",
    longDescription:
      "`column IN (subquery)` returns NULL whenever the subquery yields a NULL row, which silently filters every row from the outer query. `EXISTS (subquery)` returns a clean boolean and is typically planned more cheaply too. Literal `IN` lists (`x IN (1, 2, 3)`) are out of scope.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "perf",
    incorrect: [
      "SELECT * FROM t WHERE x IN (SELECT id FROM other);",
      "SELECT * FROM t WHERE x = ANY (SELECT id FROM other);",
    ],
    correct: [
      "SELECT * FROM t WHERE EXISTS (SELECT 1 FROM other WHERE other.id = t.x);",
      "SELECT * FROM t WHERE x IN (1, 2, 3); -- literal list is out of scope",
    ],
  },
  {
    name: "require-index-on-fk-column",
    description: "Require an index on every foreign-key column.",
    longDescription:
      "An unindexed foreign-key column makes parent-side `DELETE` / `UPDATE` perform a sequential scan of the child table to enforce the constraint. The check is cross-statement: it scans `CREATE TABLE`, `CREATE INDEX`, and `ALTER TABLE ADD CONSTRAINT` in the same file, and only requires an index whose leading column is the FK column. The PRIMARY KEY index already counts.",
    type: "problem",
    recommended: "warn",
    fixable: false,
    category: "perf",
    incorrect: [
      "CREATE TABLE t (\n  id integer PRIMARY KEY,\n  fid integer REFERENCES other(id)\n);\n-- No CREATE INDEX on t.fid in this file.",
    ],
    correct: [
      "CREATE TABLE t (\n  id integer PRIMARY KEY,\n  fid integer REFERENCES other(id)\n);\nCREATE INDEX idx_t_fid ON t (fid);",
    ],
  },
];

export const ruleByName = new Map(rules.map((r) => [r.name, r]));

export function severityLabel(s: Severity): string {
  return s === "error" ? "error" : s === "warn" ? "warn" : "off";
}

export const categoryLabel: Record<RuleMeta["category"], string> = {
  syntax: "Syntax",
  safety: "Safety",
  schema: "Schema",
  perf: "Performance",
  style: "Style",
  security: "Security",
};

export const categoryBlurb: Record<RuleMeta["category"], string> = {
  syntax: "Catches parser-level errors before they hit production.",
  safety: "Stops destructive or ambiguous operations from shipping.",
  schema: "Picks the column types and constraints that age well.",
  perf: "Avoids patterns that scale poorly at production size.",
  style: "Keeps identifiers and join shapes legible to humans.",
  security: "Closes off footguns around privileges and exposure.",
};
