SELECT o.id FROM orders o JOIN customers c ON $1 = c.region_id AND c.customer_id = o.customer_id;
SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND $1 = c.region_id WHERE $2 = o.id;
