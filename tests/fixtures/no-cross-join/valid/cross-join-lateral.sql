-- LATERAL correlates the right side with the current left row, so no
-- cartesian product is possible and there is no `ON` clause to write.
SELECT a.id, x.total
FROM accounts AS a
CROSS JOIN LATERAL (
  SELECT sum(amount) AS total
  FROM payments AS p
  WHERE p.account_id = a.id
) AS x;

SELECT a.id, t.tag
FROM articles AS a
CROSS JOIN LATERAL unnest(a.tags) AS t(tag);
