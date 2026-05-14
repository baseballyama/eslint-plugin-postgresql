ALTER TABLE t ADD COLUMN x integer DEFAULT random();
ALTER TABLE t ADD COLUMN id uuid DEFAULT gen_random_uuid();
