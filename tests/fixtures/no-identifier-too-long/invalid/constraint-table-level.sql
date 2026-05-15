CREATE TABLE items (
  id BIGSERIAL PRIMARY KEY,
  code TEXT,
  CONSTRAINT aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa CHECK (length(code) > 0)
);
