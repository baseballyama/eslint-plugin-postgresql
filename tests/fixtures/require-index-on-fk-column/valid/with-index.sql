-- FK column has a covering CREATE INDEX in the same file.
CREATE TABLE t (
  id integer PRIMARY KEY,
  fid integer REFERENCES other(id)
);
CREATE INDEX idx_t_fid ON t (fid);

-- Inline FK on the PRIMARY KEY column needs no extra index.
CREATE TABLE u (
  id integer PRIMARY KEY REFERENCES other(id)
);

-- ALTER TABLE ADD FK + matching CREATE INDEX in same file.
CREATE TABLE w (id integer);
CREATE INDEX idx_w_id ON w (id);
ALTER TABLE w ADD CONSTRAINT fk FOREIGN KEY (id) REFERENCES other(id);
