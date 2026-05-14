-- Build the index out-of-band, then promote it.
CREATE UNIQUE INDEX CONCURRENTLY idx_t_email ON t (email);
ALTER TABLE t ADD CONSTRAINT uq_t_email UNIQUE USING INDEX idx_t_email;
-- Non-UNIQUE constraints are out of scope.
ALTER TABLE t ADD CONSTRAINT c CHECK (x > 0);
