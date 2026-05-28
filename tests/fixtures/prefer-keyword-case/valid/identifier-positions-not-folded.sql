-- Regression: previously this rule walked every Keyword token and
-- case-folded it, which uppercased identifiers like `date`, `role`,
-- `value`, etc. wherever PostgreSQL's tokenizer happens to tag them as
-- keywords — column references, dotted ColumnRef field names, INSERT
-- column lists, IndexElem column references, Constraint key columns,
-- and identifier String nodes (e.g. `LANGUAGE plpgsql`).
--
-- The fix collects AST node ranges and resolves scoped identifier names
-- (IndexElem.name, Constraint.keys[*].sval) into concrete token
-- positions, then exempts those tokens from case-folding.
CREATE TABLE bar (
  id   BIGSERIAL  PRIMARY KEY,
  date date       NOT NULL,
  role text       NOT NULL,
  value text      NOT NULL
);

CREATE UNIQUE INDEX index_bar_date ON bar (date DESC, role);

ALTER TABLE bar ADD CONSTRAINT uq_bar_date UNIQUE (date);

INSERT INTO bar (date, role, value) VALUES ('2025-01-01', 'admin', 'x');
SELECT date, role, value FROM bar WHERE date > '2024-01-01';
UPDATE bar SET role = 'y' WHERE date = '2024-01-01';
