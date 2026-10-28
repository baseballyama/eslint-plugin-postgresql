-- The inner `s` is a column alias. It shares its name with the subquery
-- alias, so it must not be taken for it.
SELECT * FROM (SELECT (1) s) AS s;
