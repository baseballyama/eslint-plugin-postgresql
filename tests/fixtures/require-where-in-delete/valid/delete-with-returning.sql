DELETE FROM users WHERE created_at < now() - interval '30 days' RETURNING id;
