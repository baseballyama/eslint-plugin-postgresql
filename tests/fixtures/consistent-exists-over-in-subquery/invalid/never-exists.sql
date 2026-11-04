SELECT * FROM t WHERE EXISTS (SELECT 1 FROM other WHERE other.id = t.x);
SELECT * FROM t WHERE t.y > 0 AND EXISTS (SELECT * FROM other o WHERE o.kind = 'a' AND o.id = t.x);
SELECT * FROM t WHERE EXISTS (SELECT 1 FROM other WHERE t.x = other.id AND other.kind = 'a');
SELECT * FROM t JOIN u ON u.id = t.u_id AND EXISTS (SELECT 1 FROM other WHERE other.id = u.x);
SELECT * FROM t WHERE t.a OR EXISTS (SELECT 1 FROM other JOIN kind k ON k.id = other.kind_id WHERE k.name = 'a' AND other.id = t.x);
DELETE FROM t WHERE EXISTS (
  SELECT 1
  FROM other
  WHERE other.gone
    AND other.id = t.x
);
SELECT * FROM t WHERE EXISTS (SELECT 1 FROM other JOIN kind USING (id) AS j WHERE j.id = t.x);
