-- The parser cannot place an alias followed by a column definition
-- list, so the rule must not mistake the function name for the alias
-- and insert `AS` in front of the function.
SELECT * FROM json_to_record('{"a": 1}') json_to_record(a int);
