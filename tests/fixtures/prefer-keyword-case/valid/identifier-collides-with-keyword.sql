-- Regression for #144: column / table / constraint identifiers whose
-- spelling collides with a SQL keyword (`trigger`, `user`, `order`,
-- ...) must NOT be uppercased — they are identifiers in this position,
-- not keywords.
CREATE TABLE t (
  id       BIGINT  NOT NULL,
  trigger  TEXT    NOT NULL,
  "user"   TEXT    NOT NULL
);
