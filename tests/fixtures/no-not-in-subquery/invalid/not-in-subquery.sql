SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM blocks) LIMIT 100;
