-- Block comment INSIDE a column definition would be clobbered by the
-- realign; the rule must skip the whole table in that case.
CREATE TABLE foo (
  id /* see ticket */ ulid PRIMARY KEY,
  name text NOT NULL
);
