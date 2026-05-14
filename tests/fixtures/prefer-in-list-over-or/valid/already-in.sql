SELECT * FROM t WHERE x IN (1, 2, 3);
-- Mixed lhs: cannot collapse.
SELECT * FROM t WHERE x = 1 OR y = 2;
-- Single equality: nothing to combine.
SELECT * FROM t WHERE x = 1;
-- AND chain: not in scope.
SELECT * FROM t WHERE x = 1 AND y = 2;
