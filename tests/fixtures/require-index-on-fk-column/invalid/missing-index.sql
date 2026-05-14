CREATE TABLE t (
  id integer PRIMARY KEY,
  fid integer REFERENCES other(id)
);
-- No CREATE INDEX on t.fid in this file.
