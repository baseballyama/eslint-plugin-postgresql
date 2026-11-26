SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND o.customer_id = c.customer_id;
