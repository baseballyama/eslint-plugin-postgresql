SELECT t.id FROM t WHERE EXISTS (SELECT 1 FROM orders o JOIN customers c ON c.customer_id = t.customer_id);
