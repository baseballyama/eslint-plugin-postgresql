export const DEFAULT_EXAMPLE = `-- Try editing the SQL below. Lint runs in your browser
-- via libpg-query (WebAssembly).

CREATE TABLE "UserAccounts" (
  id BIGSERIAL,
  "Email" VARCHAR(255) NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP DEFAULT now(),
  payload JSON
);

SELECT *
FROM "UserAccounts"
WHERE id NOT IN (SELECT user_id FROM blocked);

DELETE FROM sessions;

GRANT SELECT ON "UserAccounts" TO PUBLIC;
`;
