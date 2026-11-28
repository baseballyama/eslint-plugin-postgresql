SELECT * FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND c.active;
SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND active, regions r;
SELECT o.id FROM orders o JOIN customers c ON c.customer_id = o.customer_id AND active JOIN regions r ON r.id = c.region_id;
UPDATE orders SET total = 0 FROM refunds f JOIN customers c ON c.customer_id = f.customer_id AND active WHERE orders.id = f.order_id;
DELETE FROM orders USING refunds f JOIN customers c ON c.customer_id = f.customer_id AND active WHERE orders.id = f.order_id;
