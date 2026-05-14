SELECT CASE WHEN nickname IS NOT NULL THEN nickname ELSE full_name END AS display
FROM users;
