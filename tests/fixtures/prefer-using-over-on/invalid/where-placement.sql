SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND active;
SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND c.active WHERE o.total > 0;
SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND c.active WHERE o.total > 0 OR o.rush;
SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND c.active JOIN regions r ON r.id = c.region_id, shipments s;
SELECT o.id FROM (orders o JOIN customers c ON c.customer_id = o.customer_id AND c.active) JOIN regions r ON r.id = c.region_id;
SELECT n FROM (SELECT o.id AS n FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND c.active) t;
DELETE FROM invoices USING orders o JOIN customers c ON c.customer_id = o.customer_id AND c.active WHERE invoices.order_id = o.id;
