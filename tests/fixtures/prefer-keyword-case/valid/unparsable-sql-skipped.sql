-- SQL that fails to parse has no syntax tree, so the rule cannot tell a
-- keyword from a name that spells one: `uuid` and `table_name` are columns
-- here, and `int` is a cast. The rule leaves this alone until it parses.
SELECT uuid, table_name, size::int
FROM tables
WHER uuid = 1;
