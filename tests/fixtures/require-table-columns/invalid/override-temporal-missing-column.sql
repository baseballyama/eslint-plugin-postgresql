-- `*_temporal` override requires `[tenant_id, created_at, created_by,
-- updated_at]`. This table is missing `updated_at`.
CREATE TABLE orders_temporal (
  id         bigserial PRIMARY KEY,
  tenant_id  bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT current_timestamp,
  created_by bigint NOT NULL
);
