-- An alias named like the cast's type. The rule used to insert `AS`
-- after `::`, turning `x::date date` into `x::AS date date`.
SELECT
  created_at::date date,
  created_at::timestamp timestamp,
  tags::text[] text
FROM users;
