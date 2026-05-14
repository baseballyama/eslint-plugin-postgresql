SELECT * FROM t WHERE x BETWEEN 1 AND 10;
-- Strict inequalities are not equivalent to BETWEEN; do not flag.
SELECT * FROM t WHERE x > 1 AND x < 10;
-- Different lhs: not in scope.
SELECT * FROM t WHERE x >= 1 AND y <= 10;
-- More than two conjuncts: not in scope.
SELECT * FROM t WHERE x >= 1 AND x <= 10 AND y > 0;
