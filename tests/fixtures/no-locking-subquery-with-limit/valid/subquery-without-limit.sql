-- A locking clause with no LIMIT / OFFSET: there is no bound to violate,
-- because the sub-SELECT already yields every matching row.
UPDATE jobs
SET flag = TRUE
WHERE id IN (SELECT id FROM jobs WHERE failed_at IS NULL FOR UPDATE);
