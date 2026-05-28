-- PostgreSQL has many UNRESERVED / COL_NAME / TYPE_FUNC_NAME keywords
-- that can legitimately be used as column / variable names — `role`,
-- `value`, `name`, `date`, `text`, `key`, `type`, etc. The rule must not
-- case-fold them, because doing so silently corrupts the SQL.
--
-- Regression: previously this rule walked every word that matched the
-- combined kwlist and PL/pgSQL kwlist, which uppercased `NEW.role` into
-- `NEW.ROLE`, `NEW.value` into `NEW.VALUE`, and the column list of
-- `INSERT INTO foo (role, value, name)` inside PL/pgSQL bodies. The fix
-- restricts case-folding to the reserved subset of keywords.
CREATE FUNCTION fn() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role IS NOT NULL THEN
    INSERT INTO foo (id, role, value, name, date, text)
    VALUES (NEW.id, NEW.role, NEW.value, NEW.name, NEW.date, NEW.text);
  END IF;
  RETURN NEW;
END;
$$;
