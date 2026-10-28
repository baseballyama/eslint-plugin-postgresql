-- The outer and inner subqueries share the alias `s`; the inner one must
-- be reported once, not once per subquery.
SELECT * FROM (SELECT * FROM (SELECT 1 AS x) s) AS s;
