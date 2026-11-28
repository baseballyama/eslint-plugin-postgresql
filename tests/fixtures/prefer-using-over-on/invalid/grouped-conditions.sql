SELECT o.id FROM orders o JOIN customers c ON (c.customer_id = o.customer_id AND c.active);
SELECT o.id FROM orders o JOIN customers c ON c.active AND (c.customer_id = o.customer_id AND (c.vip OR o.total > 100));
SELECT o.id FROM orders o JOIN customers c ON ((c.tier = 'gold' AND c.customer_id = o.customer_id)) AND (o.total) > 0;
