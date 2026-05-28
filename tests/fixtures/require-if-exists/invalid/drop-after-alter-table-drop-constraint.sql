-- The bare `DROP TABLE` below must be flagged, but the `DROP CONSTRAINT`
-- / `DROP COLUMN` inside the `ALTER TABLE` statements above must be
-- left untouched. (Regression: the previous token-cursor scan landed
-- the `IF EXISTS` insertion on the first `DROP` keyword in the file,
-- i.e. inside the ALTER TABLE, and ESLint's --fix loop ran the rule
-- again, producing `DROP CONSTRAINT IF EXISTS IF EXISTS ...`.)
ALTER TABLE users DROP CONSTRAINT chk_users_email;
ALTER TABLE users DROP COLUMN nickname;
DROP TABLE old_users;
