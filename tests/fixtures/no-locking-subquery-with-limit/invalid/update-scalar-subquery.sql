UPDATE jobs
SET locked_by = 'worker-1'
WHERE id = (
  SELECT id FROM jobs ORDER BY priority LIMIT 1 FOR UPDATE SKIP LOCKED
);
