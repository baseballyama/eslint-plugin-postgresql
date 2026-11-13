SELECT t.id FROM (SELECT customer_id FROM orders) recent JOIN customers t ON t.customer_id = recent.customer_id;
SELECT s.n FROM generate_series(1, 3) s (n) JOIN t ON t.n = s.n;
