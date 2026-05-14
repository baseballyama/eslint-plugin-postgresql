SELECT CASE WHEN nickname IS NULL THEN full_name ELSE nickname END AS display
FROM users;
