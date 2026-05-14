/**
 * Structured rule catalog. Hand-curated from the README and rule source.
 * Update both this file and the README in the same PR when a rule lands.
 *
 * `incorrect` and `correct` are SQL snippets used both on the rule detail
 * page and as seed input for the per-rule Playground.
 */

export type Severity = "error" | "warn" | "off";
export type RuleType = "problem" | "suggestion" | "layout";

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
    name: "prefer-jsonb-over-json",
    description: "Prefer JSONB over JSON for indexability and parsed storage.",
    longDescription:
      "`jsonb` stores a parsed representation, supports GIN indexes, and is what application code almost always wants. `json` is only the right choice if you specifically need byte-exact round-tripping of input text.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "schema",
    incorrect: ["CREATE TABLE events (payload JSON);"],
    correct: ["CREATE TABLE events (payload JSONB);"],
  },
  {
    name: "prefer-identity-over-serial",
    description: "Prefer GENERATED ... AS IDENTITY over SERIAL/BIGSERIAL.",
    longDescription:
      "Serial pseudo-types create a separately-owned sequence that does not round-trip cleanly through `pg_dump` and does not honor column-level privileges. `GENERATED ... AS IDENTITY` is the SQL-standard replacement and has been the PostgreSQL team's recommendation since version 10.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "schema",
    incorrect: [
      "CREATE TABLE t (id BIGSERIAL);",
      "CREATE TABLE t (id SERIAL);",
    ],
    correct: ["CREATE TABLE t (id BIGINT GENERATED ALWAYS AS IDENTITY);"],
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
    name: "prefer-text-over-varchar",
    description: "Prefer TEXT (+ optional CHECK) over varchar(n).",
    longDescription:
      "PostgreSQL stores `text` and `varchar(n)` the same way. The length on `varchar(n)` is enforced by a per-table constraint that you cannot relax without rewriting the table. Use `text` with a `CHECK (length(col) <= N)` when you really need a cap.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "schema",
    incorrect: ["CREATE TABLE users (name VARCHAR(255));"],
    correct: [
      "CREATE TABLE users (name TEXT);",
      "CREATE TABLE users (name TEXT CHECK (length(name) <= 255));",
    ],
  },
  {
    name: "prefer-timestamptz",
    description: "Prefer TIMESTAMPTZ over TIMESTAMP for wall-clock columns.",
    longDescription:
      "`timestamp` (a.k.a. `timestamp without time zone`) is timezone-naive: two clients with different `TimeZone` settings disagree on which instant a row represents. `timestamptz` anchors everything to UTC at storage time and converts on read.",
    type: "suggestion",
    recommended: "warn",
    fixable: false,
    category: "schema",
    incorrect: ["CREATE TABLE t (created_at TIMESTAMP);"],
    correct: [
      "CREATE TABLE t (created_at TIMESTAMPTZ);",
      "CREATE TABLE t (created_at TIMESTAMP WITH TIME ZONE);",
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
    name: "prefer-create-index-concurrently",
    description: "Prefer CREATE INDEX CONCURRENTLY in migrations.",
    longDescription:
      "A non-concurrent index build takes a `SHARE` lock on the target for the duration of the build — readers are fine, writers are blocked. Concurrent builds avoid the lock but cannot run inside a transaction. Off by default because the right answer depends on your migration framework.",
    type: "suggestion",
    recommended: "off",
    fixable: false,
    category: "perf",
    incorrect: ["CREATE INDEX idx_users_email ON users (email);"],
    correct: ["CREATE INDEX CONCURRENTLY idx_users_email ON users (email);"],
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
