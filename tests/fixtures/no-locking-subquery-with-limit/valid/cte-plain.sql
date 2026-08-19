-- A CTE holding a locking clause is never inlined, so the explicit
-- MATERIALIZED keyword is optional here.
WITH c AS (
  SELECT id FROM delayed_jobs ORDER BY priority LIMIT 1 FOR UPDATE SKIP LOCKED
)
UPDATE delayed_jobs
SET locked_at = now()
WHERE id IN (SELECT id FROM c);
