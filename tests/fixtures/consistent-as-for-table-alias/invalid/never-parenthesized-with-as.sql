SELECT s.id, u.n, j.order_id
FROM (SELECT id FROM users) AS s
JOIN unnest(ARRAY[1, 2]) AS u (n) ON u.n = s.id
JOIN (orders JOIN order_items USING (order_id)) AS j ON j.user_id = s.id;
