SELECT j.id FROM (orders o JOIN customers c ON c.customer_id = o.customer_id AND c.active) AS j;
SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id /* active only */ AND c.active;
MERGE INTO invoices i USING orders o JOIN customers c ON c.customer_id = o.customer_id AND c.active ON i.order_id = o.id WHEN MATCHED THEN DELETE;
UPDATE invoices SET paid = TRUE FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND c.active WHERE CURRENT OF unpaid;
