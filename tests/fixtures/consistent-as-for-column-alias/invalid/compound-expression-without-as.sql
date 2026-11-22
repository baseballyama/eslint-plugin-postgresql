-- When the alias is omitted on a TypeCast value the rule's old logic
-- would have corrupted `()::ulid id` into `()::AS ulid id` (parser range
-- ends mid-cast). The rule steps over the tokens no range covers (here
-- `COUNT`'s `(*)`) and requires the next token to match the alias name
-- before inserting `AS`.
SELECT
  COUNT(*) total,
  id user_id
FROM users;
