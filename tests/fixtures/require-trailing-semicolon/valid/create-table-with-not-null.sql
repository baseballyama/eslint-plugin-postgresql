-- Regression for #143: the parser's per-statement range[1] for a
-- single CREATE TABLE pointed mid-NOT-NULL on the last column. The
-- rule used to insert `;` between NOT and NULL there. The rewrite to
-- a file-level check makes this fixture a no-op.
CREATE TABLE t (
  a  TEXT     NOT NULL,
  b  TEXT     NOT NULL,
  c  INTEGER  NOT NULL
);
