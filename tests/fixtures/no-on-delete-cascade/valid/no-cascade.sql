CREATE TABLE t (
  id integer,
  fid integer REFERENCES other(id),
  fid2 integer REFERENCES other(id) ON DELETE RESTRICT,
  fid3 integer REFERENCES other(id) ON DELETE SET NULL
);
ALTER TABLE t ADD CONSTRAINT fk FOREIGN KEY (fid) REFERENCES other(id) ON DELETE NO ACTION;
