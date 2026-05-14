SELECT CASE
  WHEN nickname IS NULL THEN full_name
  WHEN length(nickname) = 0 THEN full_name
  ELSE nickname
END AS display
FROM users;
