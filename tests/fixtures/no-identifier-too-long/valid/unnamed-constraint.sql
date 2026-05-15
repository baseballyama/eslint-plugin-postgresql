-- An unnamed constraint has no user-supplied name to compare against the limit;
-- PostgreSQL will generate one, separately covered by `require-named-constraint`.
ALTER TABLE items ADD CHECK (length(code) > 0);

CREATE TABLE items2 (
  id BIGSERIAL PRIMARY KEY,
  code TEXT,
  CHECK (length(code) > 0)
);
