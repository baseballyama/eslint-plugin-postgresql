INSERT INTO users (name) VALUES ('a') RETURNING id user_id;
UPDATE users SET name = 'b' WHERE id = 1 RETURNING id user_id;
DELETE FROM users WHERE id = 1 RETURNING id user_id;
MERGE INTO users USING staged_users ON users.id = staged_users.user_id
WHEN MATCHED THEN DELETE
RETURNING id user_id;
