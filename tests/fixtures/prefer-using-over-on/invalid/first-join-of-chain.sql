SELECT o.id
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
JOIN regions r ON r.id = c.region_id;
