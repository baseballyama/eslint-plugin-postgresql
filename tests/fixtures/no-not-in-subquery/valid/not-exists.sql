SELECT id FROM users u WHERE NOT EXISTS (SELECT 1 FROM blocks b WHERE b.user_id = u.id) LIMIT 100;
