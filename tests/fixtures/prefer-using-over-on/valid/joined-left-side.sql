-- `orders` and `shipments` might both have `customer_id`, which `USING` rejects.
SELECT o.id
FROM orders o
JOIN shipments s ON s.order_id = o.id
JOIN customers c ON c.customer_id = o.customer_id;
