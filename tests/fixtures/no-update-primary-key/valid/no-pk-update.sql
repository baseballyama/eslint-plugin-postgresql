UPDATE users SET name = 'foo' WHERE id = 1;
UPDATE orders SET total = 100, status = 'paid' WHERE id = 2;
-- non-PK column happens to share a name with another table's PK pattern
-- (orders.user_id is a foreign key, not the orders PK by the heuristic)
UPDATE orders SET user_id = 5 WHERE id = 3;
