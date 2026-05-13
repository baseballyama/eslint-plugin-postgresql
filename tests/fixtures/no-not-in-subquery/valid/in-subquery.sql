SELECT 1 FROM users WHERE id IN (SELECT user_id FROM admins) LIMIT 100;
