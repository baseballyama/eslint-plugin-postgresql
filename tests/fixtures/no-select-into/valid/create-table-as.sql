CREATE TABLE archived_users AS SELECT id, name FROM users WHERE inactive;
