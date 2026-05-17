CREATE FUNCTION example() RETURNS void
LANGUAGE PLPGSQL
AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE some_table SET x = 1;
  GET DIAGNOSTICS affected = row_count;
END;
$$;
