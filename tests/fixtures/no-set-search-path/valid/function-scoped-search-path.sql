-- A `search_path` pin that belongs to a function definition is the documented
-- mitigation for search_path injection and is required by
-- `no-security-definer-without-search-path`. It must not be flagged here.

-- Empty search_path with fully-qualified bodies: the strongest hardening.
CREATE FUNCTION fn() RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$ BEGIN END $$;

-- The non-empty form PostgreSQL's own docs recommend.
CREATE OR REPLACE FUNCTION fn2() RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$ BEGIN END $$;

-- Procedures share the CreateFunctionStmt node.
CREATE PROCEDURE pr()
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$ BEGIN END $$;

-- The same pin applied to an existing function.
ALTER FUNCTION fn() SET search_path = pg_catalog;
