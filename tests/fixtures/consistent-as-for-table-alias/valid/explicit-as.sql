SELECT u.id FROM users AS u WHERE u.active = TRUE;
SELECT u.id FROM public.users AS u JOIN orders AS o ON o.user_id = u.id;
SELECT u.id FROM users WHERE active = TRUE;
