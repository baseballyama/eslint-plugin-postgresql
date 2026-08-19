-- A sub-SELECT in FROM is planned as its own scan node rather than an
-- expression re-evaluated per row, so it stays outside this rule's scope.
UPDATE jobs
SET flag = TRUE
FROM (SELECT id FROM jobs ORDER BY priority LIMIT 1 FOR UPDATE SKIP LOCKED) s
WHERE jobs.id = s.id;
