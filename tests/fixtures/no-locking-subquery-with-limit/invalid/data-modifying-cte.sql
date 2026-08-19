-- The UPDATE is itself a CTE body, but the sub-SELECT inside its WHERE
-- clause is still an expression sub-SELECT of a data-modifying statement.
WITH locked AS (
  UPDATE jobs
  SET flag = TRUE
  WHERE id IN (SELECT id FROM jobs LIMIT 1 FOR UPDATE SKIP LOCKED)
  RETURNING id
)
SELECT id FROM locked;
