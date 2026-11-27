SELECT * FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND c.active;
SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND active, regions r;
SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND active JOIN regions r ON r.id = c.region_id;
