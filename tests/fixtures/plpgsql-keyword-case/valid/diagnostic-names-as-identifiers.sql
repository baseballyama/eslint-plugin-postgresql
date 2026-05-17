CREATE FUNCTION example() RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
DECLARE
  row_count INTEGER;
  column_name TEXT;
  table_name TEXT;
  schema_name TEXT;
  message_text TEXT;
BEGIN
  SELECT COUNT(*) INTO row_count FROM some_table;
  IF row_count > 0 THEN
    RAISE NOTICE 'rows: %', row_count;
  END IF;
  SELECT 'a', 'b', 'c'
    INTO column_name, table_name, schema_name;
  RETURN NEW;
END;
$$;
