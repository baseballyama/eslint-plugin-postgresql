---
"eslint-plugin-postgresql": minor
---

Fix the recurring identifier-corruption class in the `keyword-case` rules.

PostgreSQL's keyword table mixes truly-reserved tokens (`SELECT`, `FROM`, `AND`, `IS`, `NULL`, …) with words that the grammar allows as column / function / variable names (`role`, `date`, `value`, `name`, `text`, `key`, `type`, `language`, …). Both case-folding rules used to walk every token tagged as `Keyword` (or every word matching the combined PL/pgSQL kwlist) and uppercased it, so they corrupted real-world SQL in several ways:

- `NEW.role` → `NEW.ROLE`, `OLD.value` → `OLD.VALUE`, `t.date` → `t.DATE` inside PL/pgSQL bodies
- `INSERT INTO foo (date, role)` → `INSERT INTO foo (DATE, role)` and the same pattern inside PL/pgSQL
- `CREATE UNIQUE INDEX … (date DESC, role)` → `CREATE UNIQUE INDEX … (DATE DESC, role)`
- `ALTER TABLE … ADD CONSTRAINT … UNIQUE (date)` → `… UNIQUE (DATE)`
- `LANGUAGE plpgsql` → `LANGUAGE PLPGSQL`
- `CREATE TABLE foo (date date NOT NULL)` → `CREATE TABLE foo (DATE date NOT NULL)` (column name uppercased)

`postgresql/prefer-keyword-case` is fixed by extending the AST-aware skip set:

- `ColumnRef`, `RangeVar` are now treated as range-contains (any token inside the dotted / schema-qualified identifier path is exempt, not just the first one).
- `ResTarget` without `val` (INSERT / UPDATE column-list entries) is added as range-contains so `INSERT INTO foo (date, role)` keeps its column names.
- Bare `String` AST nodes (excluding `A_Const`-wrapped string literals) are treated as identifier positions, which exempts identifier references that the rest of the AST already classifies (`LANGUAGE plpgsql`, function arg names, …).
- `IndexElem.name` and `Constraint.{keys,pk_attrs,fk_attrs}[*].sval` are resolved into concrete token positions by name-matching within the enclosing top-level statement range. This handles `CREATE INDEX … (date)`, `UNIQUE (date)`, and `PRIMARY KEY (id, role)`.

`postgresql/plpgsql-keyword-case` is fixed in two complementary ways:

- After-dot identifier guard: a word that follows `.` (with optional inline whitespace, but not `..`) is the right-hand side of a dotted reference and can only be an identifier — never case-folded.
- Restrict case-folding to the new `PLPGSQL_RESERVED_KEYWORDS` set (kwlist.h `RESERVED_KEYWORD` plus `pl_reserved_kwlist.h`). `UNRESERVED_KEYWORD` / `COL_NAME_KEYWORD` / `TYPE_FUNC_NAME_KEYWORD` are skipped because they can legitimately appear as column / function names, and the regex-based PL/pgSQL pass can't reliably tell which.

The keyword-list generator (`scripts/generate-pg-keywords.js`) drops the old combined `PLPGSQL_KEYWORDS` export and emits `PLPGSQL_RESERVED_KEYWORDS` instead — the larger union of kwlist + PL/pgSQL kwlist had no remaining consumer, and keeping it around would invite future identifier-corruption regressions of the same shape.
