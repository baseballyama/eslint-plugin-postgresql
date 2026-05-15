-- ALTER TABLE ADD CONSTRAINT FK that includes `tenant_id`.
ALTER TABLE orders
  ADD CONSTRAINT orders_user_fk
  FOREIGN KEY (tenant_id, user_id) REFERENCES users (tenant_id, id);
