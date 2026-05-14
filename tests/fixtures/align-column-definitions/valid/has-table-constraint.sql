-- The rule does not realign tables that mix column defs with table-level
-- constraints, since the safe rewrite for those is more involved.
CREATE TABLE foo (
  id ulid,
  name text,
  PRIMARY KEY (id, name)
);
