-- A SELECT with no FROM clause returns exactly one row, so there is nothing
-- for LIMIT to bound. These show up constantly in ORM code that calls a
-- function through a raw query.
SELECT pg_advisory_xact_lock(42);
SELECT set_config('app.user_id', 'u1', true);
SELECT pg_notify('channel', 'payload');
SELECT 1;
SELECT current_timestamp AS now;
