-- OFFSET bounds the sub-SELECT the same way LIMIT does, so the window
-- slides once rows start getting skipped.
UPDATE jobs
SET flag = TRUE
WHERE id IN (SELECT id FROM jobs ORDER BY id OFFSET 10 FOR SHARE);
