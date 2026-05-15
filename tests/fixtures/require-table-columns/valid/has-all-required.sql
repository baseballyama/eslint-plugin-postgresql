-- All required columns are present.
CREATE TABLE orders (
  id         bigserial PRIMARY KEY,
  tenant_id  bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT current_timestamp,
  created_by bigint NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT current_timestamp,
  updated_by bigint NOT NULL
);
