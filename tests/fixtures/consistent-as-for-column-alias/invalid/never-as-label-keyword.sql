-- PostgreSQL accepts some keywords (`month`, `from`, ...) as a column
-- alias only after `AS`, so it stays. A quoted alias is an ordinary
-- identifier, so its `AS` goes.
SELECT
  to_char(created_at, 'YYYY-MM') AS month,
  created_at AS from,
  id AS "order",
  name AS full_name
FROM users;
