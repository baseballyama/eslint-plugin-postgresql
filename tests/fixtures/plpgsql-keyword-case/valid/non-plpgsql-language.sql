-- The rule only touches plpgsql bodies. A SQL function body's keyword
-- casing is not in scope here.
CREATE FUNCTION add_one(n integer) RETURNS integer AS $$
  select n + 1;
$$ LANGUAGE sql;
