WITH RECURSIVE r AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM r
) SELECT * FROM r LIMIT 10;
-- Non-recursive CTEs are out of scope.
WITH r AS (SELECT 1 AS n) SELECT * FROM r;
