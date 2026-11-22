SELECT
  u.id AS user_id,
  count(*) AS total,
  extract(epoch FROM u.expires_at) * 1000 AS expires_ms,
  CAST(u.created_at AS date) AS created_on,
  CASE WHEN u.active THEN 'a' ELSE 'b' END AS status,
  u.tags[1] AS first_tag,
  row_number() OVER (ORDER BY u.id) AS row_num,
  (SELECT max(o.id) AS max_id FROM orders o) AS last_order_id
FROM users u;
