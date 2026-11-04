SELECT * FROM t WHERE EXISTS (SELECT 1 FROM other WHERE (other.id = t.x));
