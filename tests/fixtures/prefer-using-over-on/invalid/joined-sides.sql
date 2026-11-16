SELECT o.id FROM orders o JOIN shipments s ON s.order_id = o.id JOIN customers c ON c.customer_id = o.customer_id;
SELECT o.id FROM orders o JOIN (customers c JOIN regions r ON r.id = c.region_id) ON c.customer_id = o.customer_id;
SELECT o.id
FROM orders o
JOIN shipments s ON s.order_id = o.id
JOIN customers c ON c.customer_id = o.customer_id AND c.since < s.shipped_at;
