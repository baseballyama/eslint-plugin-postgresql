-- `AS` is required before a JOIN ... USING alias, so `never` must not
-- flag it.
SELECT j.order_id FROM orders JOIN order_items USING (order_id) AS j;
