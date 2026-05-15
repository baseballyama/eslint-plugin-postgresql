-- Table-level FK that does not include `tenant_id`.
CREATE TABLE orders (
  tenant_id bigint NOT NULL,
  id        bigint NOT NULL,
  user_id   bigint NOT NULL,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (user_id) REFERENCES users (id)
);
