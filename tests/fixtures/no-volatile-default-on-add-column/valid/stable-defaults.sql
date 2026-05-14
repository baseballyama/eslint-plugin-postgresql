-- Literals and STABLE defaults qualify for the PG10+ stable-default
-- short-cut and do NOT trigger a table rewrite.
ALTER TABLE t ADD COLUMN x integer DEFAULT 1;
ALTER TABLE t ADD COLUMN y text DEFAULT 'literal';
ALTER TABLE t ADD COLUMN z timestamptz DEFAULT now();
ALTER TABLE t ADD COLUMN w timestamptz DEFAULT current_timestamp;
-- ADD COLUMN with no default is also fine.
ALTER TABLE t ADD COLUMN id integer;
