-- The parser anchors dotted columns and function calls on their first
-- name, and no range covers a closing `)` or a CASE's `END`. The rule
-- steps over those tokens to reach the alias, including one named `end`.
SELECT
  u.id user_id,
  to_char(u.created_at, 'YYYY-MM') created_month,
  CAST(u.created_at AS date) created_on,
  CASE WHEN u.active THEN 'a' ELSE 'b' END end
FROM users u;
