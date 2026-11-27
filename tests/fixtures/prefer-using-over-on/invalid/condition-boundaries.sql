SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND c.since BETWEEN o.created_at - 30 AND o.created_at;
SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND c.order > 0 AND c.ids <@ ARRAY[1, 2], regions r;
SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND c.since::timestamp with time zone > o.created_at, regions r;
SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND c.active INNER JOIN regions r ON r.id = c.region_id;
SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND c.active CROSS JOIN regions r;
SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND c.active NATURAL JOIN refunds;
SELECT o.id FROM regions r JOIN orders o JOIN customers c ON c.customer_id = o.customer_id AND c.active ON r.id = o.region_id;
SELECT o.id FROM regions r JOIN orders o JOIN customers c ON c.customer_id = o.customer_id AND c.active USING (zone_id);
