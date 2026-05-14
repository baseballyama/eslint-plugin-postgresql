CREATE TABLE t (
  id    bigint  NOT NULL,
  body  text    NOT NULL
);

CREATE FUNCTION fn(arr text[]) RETURNS BOOLEAN LANGUAGE SQL AS '';
DROP FUNCTION IF EXISTS fn(text[]);
