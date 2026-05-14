SELECT u.id FROM users u LEFT JOIN orders o ON o.user_id = u.id;
SELECT u.id FROM users u RIGHT JOIN orders o ON o.user_id = u.id;
SELECT u.id FROM users u FULL JOIN orders o ON o.user_id = u.id;
