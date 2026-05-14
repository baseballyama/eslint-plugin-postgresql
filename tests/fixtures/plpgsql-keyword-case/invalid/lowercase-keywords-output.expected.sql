CREATE FUNCTION foo() RETURNS void AS $$
DECLARE
  user_count INTEGER;
BEGIN
  IF user_count IS NULL THEN
    RAISE NOTICE 'hello';
  END IF;
END;
$$ LANGUAGE plpgsql;
