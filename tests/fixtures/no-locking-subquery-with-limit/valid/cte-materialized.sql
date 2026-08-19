-- The recommended fix: a CTE is evaluated exactly once, so the LIMIT
-- really does bound how many rows the UPDATE touches.
WITH u2 AS MATERIALIZED (
  SELECT id
  FROM upd
  WHERE upd.category = 42
  FOR NO KEY UPDATE SKIP LOCKED
  LIMIT 1
)
UPDATE upd AS u
SET flag = TRUE
FROM u2
WHERE u.category = 42
  AND u.id = u2.id;
