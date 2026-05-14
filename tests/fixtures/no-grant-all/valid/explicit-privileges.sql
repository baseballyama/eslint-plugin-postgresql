GRANT SELECT ON t TO u;
GRANT SELECT, INSERT, UPDATE ON t TO u;
-- REVOKE ALL is the safe direction; not flagged.
REVOKE ALL ON t FROM u;
