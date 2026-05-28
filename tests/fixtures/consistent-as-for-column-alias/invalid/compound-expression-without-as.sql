-- When the alias is omitted on a TypeCast value the rule's old logic
-- would have corrupted `()::ulid id` into `()::AS ulid id` (parser range
-- ends mid-cast). The defensive check requires the next token to match
-- the alias name before inserting `AS`, so we only flag the bare ones
-- whose next token actually is the alias.
SELECT
  COUNT(*) total,
  id user_id
FROM users;
