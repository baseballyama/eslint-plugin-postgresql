-- In `WHERE`, `c.active` would drop the orders an outer join keeps.
SELECT o.id FROM orders o LEFT JOIN customers c ON c.customer_id = o.customer_id AND c.active;
SELECT o.id
FROM customers c
JOIN regions r ON r.region_id = c.region_id AND r.active
RIGHT JOIN orders o ON o.customer_id = c.customer_id;
