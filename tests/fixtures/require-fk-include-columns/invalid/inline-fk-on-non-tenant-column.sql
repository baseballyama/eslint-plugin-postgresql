-- Column-level (inline) FK on a non-tenant column — the FK's referencing
-- column list is just `[user_id]`, which is missing `tenant_id`.
CREATE TABLE orders (
  tenant_id bigint NOT NULL,
  id        bigserial PRIMARY KEY,
  user_id   bigint REFERENCES users (id)
);
