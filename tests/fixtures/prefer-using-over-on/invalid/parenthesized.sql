SELECT o.id FROM orders o JOIN customers c ON ((c.customer_id = o.customer_id)) WHERE o.total > 0;
