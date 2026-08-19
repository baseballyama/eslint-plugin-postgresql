-- No locking clause: re-running the sub-SELECT returns the same rows,
-- so the window never slides and the LIMIT holds.
UPDATE jobs
SET flag = TRUE
WHERE id IN (SELECT id FROM jobs ORDER BY priority LIMIT 1);
