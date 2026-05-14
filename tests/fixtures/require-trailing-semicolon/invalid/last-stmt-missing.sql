SELECT id FROM users;
INSERT INTO events (kind) VALUES ('login');
UPDATE users SET active = FALSE WHERE id = 1
