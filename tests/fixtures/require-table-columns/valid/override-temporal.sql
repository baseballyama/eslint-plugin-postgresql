-- `*_temporal` tables follow an override that only requires
-- `tenant_id`, `created_at`, `created_by`, `updated_at` (no
-- `updated_by`), because rows are append-only.
CREATE TABLE orders_temporal (
  id         bigserial PRIMARY KEY,
  tenant_id  bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT current_timestamp,
  created_by bigint NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT current_timestamp
);
