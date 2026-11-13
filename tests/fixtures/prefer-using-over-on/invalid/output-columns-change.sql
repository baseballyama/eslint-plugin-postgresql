SELECT * FROM orders o JOIN customers c ON c.customer_id = o.customer_id;
SELECT j.* FROM (orders o JOIN customers c ON c.customer_id = o.customer_id) AS j;
UPDATE invoices SET paid = TRUE FROM orders o JOIN customers c ON c.customer_id = o.customer_id WHERE invoices.order_id = o.id RETURNING *;
SELECT j.* FROM (orders o JOIN customers c ON c.customer_id = o.customer_id JOIN regions r ON r.id = c.region_id) AS j;
