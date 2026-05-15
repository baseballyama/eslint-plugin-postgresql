-- Table-level composite FK that includes `tenant_id`.
CREATE TABLE orders (
  tenant_id bigint NOT NULL,
  id        bigint NOT NULL,
  user_id   bigint NOT NULL,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users (tenant_id, id)
);
