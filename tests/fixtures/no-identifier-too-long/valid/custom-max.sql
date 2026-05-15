-- A user who compiled PostgreSQL with a larger NAMEDATALEN can raise `max`.
-- This identifier is 64 bytes — over the default 63 but under the override.
CREATE TABLE aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa (
  id BIGSERIAL PRIMARY KEY
);
