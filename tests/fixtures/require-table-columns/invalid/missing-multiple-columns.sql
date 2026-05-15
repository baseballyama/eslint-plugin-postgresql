-- Missing `tenant_id`, `created_by`, and `updated_by`.
CREATE TABLE orders (
  id         bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT current_timestamp,
  updated_at timestamptz NOT NULL DEFAULT current_timestamp
);
