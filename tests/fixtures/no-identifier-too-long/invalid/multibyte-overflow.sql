-- 22 instances of the 3-byte character '長' = 66 bytes, which is over the
-- 63-byte limit even though it is only 22 characters long. The rule must
-- count bytes, not characters.
CREATE TABLE "長長長長長長長長長長長長長長長長長長長長長長" (
  id BIGSERIAL PRIMARY KEY
);
