-- `ALTER TABLE ... DROP CONSTRAINT` / `DROP COLUMN` are part of an
-- `AlterTableStmt`, not a `DropStmt`. The rule must not match them.
-- (Regression: previously the rule scanned all DROP keywords in the file
-- and inserted `IF EXISTS` inside the ALTER TABLE statement, producing
-- `DROP CONSTRAINT IF EXISTS IF EXISTS ...` syntax errors.)
ALTER TABLE users DROP CONSTRAINT chk_users_email;
ALTER TABLE users DROP COLUMN nickname;
-- A subsequent DropStmt should still be flagged.
DROP TABLE IF EXISTS old_users;
