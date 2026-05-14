SELECT category, count(*) FROM items GROUP BY category HAVING count(*) > 1;
