SELECT u.name, p.title
FROM users u
    JOIN posts p ON u.id = p.user_id
WHERE
    u.active = true;