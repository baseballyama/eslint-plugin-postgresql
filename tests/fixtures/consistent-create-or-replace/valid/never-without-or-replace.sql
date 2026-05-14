CREATE FUNCTION fn() RETURNS void LANGUAGE SQL AS '';
CREATE PROCEDURE p() LANGUAGE SQL AS '';
CREATE VIEW v AS SELECT 1;
-- Other CREATE statements are out of scope.
CREATE TABLE t (id integer);
CREATE INDEX idx ON t (id);
