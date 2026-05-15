CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  CONSTRAINT users_email_uniq UNIQUE (email)
);

CREATE INDEX idx_users_email ON users (email);

CREATE SCHEMA app;

CREATE SEQUENCE app.order_seq;

CREATE OR REPLACE FUNCTION app.touch_updated_at() RETURNS trigger AS $$ BEGIN RETURN new; END; $$ LANGUAGE plpgsql;

CREATE VIEW active_users AS SELECT id FROM users;

CREATE TRIGGER trg_users_touch BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

ALTER TABLE users RENAME TO accounts;
