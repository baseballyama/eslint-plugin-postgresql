UPDATE t SET x = u.x FROM u WHERE t.id = u.t_id;
-- No FROM → out of scope.
UPDATE t SET x = 1;
UPDATE t SET x = 1 WHERE id = 5;
