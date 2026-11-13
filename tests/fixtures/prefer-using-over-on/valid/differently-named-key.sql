-- `USING` can't name `order_id = id`, so the join keeps `ON`.
SELECT o.id FROM orders o JOIN invoices i ON i.order_id = o.id AND i.tenant_id = o.tenant_id;
