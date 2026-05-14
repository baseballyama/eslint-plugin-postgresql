ALTER TABLE orders ADD CONSTRAINT positive_amount CHECK (amount > 0);
