SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND c.active;
SELECT o.id
FROM orders o
JOIN customers c ON o.created_at < c.closed_at AND c.customer_id = o.customer_id
WHERE o.total > 0;
SELECT o.id
FROM orders o
JOIN customers c ON EXISTS (SELECT 1 FROM refunds r JOIN payments p ON p.refund_id = r.id) AND c.customer_id = o.customer_id;
