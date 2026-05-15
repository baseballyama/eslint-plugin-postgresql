-- No FK constraints — nothing to flag.
CREATE TABLE orders (
  id        bigserial PRIMARY KEY,
  tenant_id bigint NOT NULL,
  amount    numeric(10, 2)
);
