-- Names that spell the functions are not calls, so they are left alone.
SELECT 1 AS current_timestamp, t.current_timestamp, t.localtimestamp, t.localtime FROM t;
SELECT 1 AS localtimestamp, pg_catalog.now() FROM t;
