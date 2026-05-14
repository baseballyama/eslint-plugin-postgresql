-- Inline comments would be clobbered by a naive realign; skip.
CREATE TABLE foo (
  id ulid PRIMARY KEY, -- the surrogate key
  name text NOT NULL
);
