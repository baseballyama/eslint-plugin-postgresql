SELECT * FROM t WHERE EXISTS (SELECT 1 FROM other WHERE (other.id = t.x));
SELECT * FROM t WHERE EXISTS (SELECT 1 FROM other WHERE other.id = (t.x));
SELECT * FROM t WHERE EXISTS (SELECT 1 FROM other WHERE (other.id) = t.x);
SELECT * FROM t WHERE EXISTS (SELECT 1 FROM other WHERE other.gone /* kept */ AND other.id = t.x);
SELECT * FROM t WHERE EXISTS (SELECT 1 FROM other WHERE other.id = t.x -- kept
  AND other.k = 1);
SELECT * FROM t WHERE EXISTS (SELECT /* kept */ 1 FROM other WHERE other.id = t.x);
