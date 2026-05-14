CREATE FUNCTION fn() RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$ BEGIN END $$;

-- SECURITY INVOKER (the default) is fine.
CREATE FUNCTION fn2() RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$ BEGIN END $$;

-- No SECURITY DEFINER → out of scope.
CREATE FUNCTION fn3() RETURNS void
LANGUAGE plpgsql
AS $$ BEGIN END $$;
