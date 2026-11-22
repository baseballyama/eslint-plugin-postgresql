-- `x IS JSON value` would read `value` as part of the predicate, so this
-- `AS` must stay.
SELECT doc IS JSON AS value FROM docs;
