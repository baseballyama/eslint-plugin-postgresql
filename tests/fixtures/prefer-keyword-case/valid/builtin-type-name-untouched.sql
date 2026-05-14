-- Regression for #145: built-in type names in function signatures,
-- column types, and casts must not be uppercased — uppercasing them
-- mixes case with user-defined types like `ulid` that the rule cannot
-- touch.
CREATE FUNCTION fn(
  ulid,
  text,
  int
) RETURNS void LANGUAGE SQL AS '';

CREATE TABLE t (
  id    ulid,
  name  text
);

SELECT x::text FROM t;
SELECT CAST(x AS int) FROM t;
