-- These keywords can continue the value before them, so PostgreSQL needs
-- the `AS`: `x + y at` would start `AT TIME ZONE`, and `U&'...' uescape`
-- expects a string. The `AS` before `full_name` still goes.
SELECT
  price + tax AS at,
  a = b AS in,
  NOT a AS is,
  name LIKE 'a%' AS escape,
  U&'d\0061t\+000061' AS uescape,
  name AS full_name
FROM items;
