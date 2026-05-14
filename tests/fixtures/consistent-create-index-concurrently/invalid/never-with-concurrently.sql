CREATE INDEX CONCURRENTLY idx_users_email ON users (email);
CREATE UNIQUE INDEX CONCURRENTLY idx_users_uid ON users (uid);
