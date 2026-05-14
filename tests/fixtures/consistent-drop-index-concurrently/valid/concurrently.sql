DROP INDEX CONCURRENTLY idx_users;
DROP INDEX CONCURRENTLY IF EXISTS idx_orders;
-- Non-index DROPs are out of scope.
DROP TABLE old_table;
