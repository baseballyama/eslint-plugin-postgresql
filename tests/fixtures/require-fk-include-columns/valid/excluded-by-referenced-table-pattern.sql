-- The referenced table `tenants` is shared across tenants by definition,
-- so an FK to it does not need to carry `tenant_id`.
CREATE TABLE orders (
  id        bigserial PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenants (id)
);
