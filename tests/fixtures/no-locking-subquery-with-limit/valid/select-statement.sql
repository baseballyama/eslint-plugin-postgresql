-- Nothing is modified, so no row can drop out of the window mid-statement.
SELECT id FROM jobs ORDER BY priority LIMIT 1 FOR UPDATE SKIP LOCKED;

SELECT id
FROM jobs
WHERE id IN (SELECT id FROM jobs LIMIT 1 FOR UPDATE SKIP LOCKED);
