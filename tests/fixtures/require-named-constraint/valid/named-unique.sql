CREATE TABLE items (
  id int,
  code text,
  CONSTRAINT items_code_unique UNIQUE (code)
);
