-- `audit_*` tables are excluded by `excludeTablePattern`, so a missing
-- `tenant_id` is not reported.
CREATE TABLE audit_events (
  id      bigserial PRIMARY KEY,
  user_id bigint REFERENCES users (id)
);
