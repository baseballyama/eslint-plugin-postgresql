SELECT u.id FROM users u INNER JOIN orders o ON o.user_id = u.id;
SELECT u.id FROM users u CROSS JOIN regions r;
SELECT u.id FROM users u NATURAL JOIN profiles p;
SELECT u.id FROM users u LEFT JOIN orders o ON o.user_id = u.id;
SELECT u.id FROM users u LEFT OUTER JOIN orders o ON o.user_id = u.id;
