-- ALTER TABLE ADD CONSTRAINT FK without `tenant_id`.
ALTER TABLE orders
  ADD CONSTRAINT orders_user_fk
  FOREIGN KEY (user_id) REFERENCES users (id);
