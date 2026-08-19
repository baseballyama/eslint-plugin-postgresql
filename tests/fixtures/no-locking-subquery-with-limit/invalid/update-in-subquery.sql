-- The shape reported as PostgreSQL BUG #15715: the LIMIT bounds the
-- sub-SELECT, not the UPDATE, so every candidate row can be locked.
UPDATE delayed_jobs
SET locked_at = now()
WHERE id IN (
  SELECT id
  FROM delayed_jobs
  WHERE failed_at IS NULL
  ORDER BY priority, run_at
  LIMIT 1
  FOR UPDATE
);
