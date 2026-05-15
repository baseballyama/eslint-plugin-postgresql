-- Matches `exclude` pattern (`^audit_`) — no check is performed.
CREATE TABLE audit_events (
  id   bigserial PRIMARY KEY,
  data jsonb
);
