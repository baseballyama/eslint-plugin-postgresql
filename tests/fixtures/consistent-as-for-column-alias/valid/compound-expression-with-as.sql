-- TypeCast (`expr::type`), dotted ColumnRef (`t.col`) and CASE expressions
-- expose parser ranges that stop in the middle of the value expression
-- (e.g. on `::` between the inner expr and the type name, or on the
-- first dotted segment). The rule must still see `AS` as present.
-- (Regression: the rule used to look at the token immediately after the
-- parser-reported value range and, when that token was `ulid` / `.` /
-- `WHEN` instead of `AS`, it inserted `AS` in the middle of the
-- expression, producing `()::AS ulid`, `uAS .col`, `CASE AS WHEN ...`.)
SELECT
  generate_ulid_plv8()::ulid AS some_id,
  u.user_id AS created_by,
  CASE WHEN x = 1 THEN 'a' WHEN x = 2 THEN 'b' ELSE 'c' END AS label
FROM users u;
