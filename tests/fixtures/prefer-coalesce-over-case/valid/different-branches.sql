SELECT CASE WHEN created_at IS NULL THEN 'unknown' ELSE 'set' END AS status
FROM users;
