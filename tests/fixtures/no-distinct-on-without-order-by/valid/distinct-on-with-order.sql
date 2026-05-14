SELECT DISTINCT ON (customer_id) customer_id, amount
FROM orders
ORDER BY customer_id, created_at DESC;
