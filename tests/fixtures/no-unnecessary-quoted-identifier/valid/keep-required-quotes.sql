-- Reserved keyword: must stay quoted.
SELECT "select" FROM users;
-- COL_NAME_KEYWORD (cannot be function/type name without quoting): kept conservatively.
SELECT "between" FROM users;
-- Mixed case would case-fold to a different identifier when unquoted.
SELECT "MyColumn" FROM "MyTable";
-- Embedded double quote — cannot be unquoted.
SELECT "weird""name" FROM users;
-- String literals (single quotes) are not identifiers and must be left alone.
SELECT 'select' FROM users;
