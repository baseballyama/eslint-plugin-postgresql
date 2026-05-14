SELECT u.id FROM users u LEFT OUTER JOIN orders o ON o.user_id = u.id;
SELECT u.id FROM users u RIGHT OUTER JOIN orders o ON o.user_id = u.id;
SELECT u.id FROM users u FULL OUTER JOIN orders o ON o.user_id = u.id;
