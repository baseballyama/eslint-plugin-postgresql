SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id OR c.customer_id IS NULL;
SELECT o.id FROM orders o JOIN customers c ON c.customer_id > o.customer_id;
SELECT o.id FROM orders o JOIN customers c ON c.customer_id IS NOT DISTINCT FROM o.customer_id;
SELECT o.id FROM orders o JOIN customers c ON c.* = o.*;
SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id OR c.tenant_id = o.tenant_id;
