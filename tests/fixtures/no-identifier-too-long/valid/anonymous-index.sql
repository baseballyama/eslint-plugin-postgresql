-- `CREATE INDEX ON foo (bar)` lets PostgreSQL pick the name — `idxname` is
-- unset on the IndexStmt, so there is nothing for this rule to flag.
CREATE INDEX ON aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa (bar);
