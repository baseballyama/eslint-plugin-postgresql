CREATE FUNCTION foo() RETURNS void AS $$
DECLARE
  user_count INTEGER;
BEGIN
  IF user_count IS NULL THEN
    RAISE NOTICE 'select from where stays alone';
  END IF;
  -- the comment also stays alone: select from where
END;
$$ LANGUAGE plpgsql;
