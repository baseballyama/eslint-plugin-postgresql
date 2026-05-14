-- Regression for #159: INSERT ... VALUES (...) is rewritten by
-- libpg-query into a SelectStmt with `valuesLists`, but LIMIT has no
-- meaning there.
INSERT INTO t (id, name) VALUES
  (1, 'alpha'),
  (2, 'beta');
