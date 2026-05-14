CREATE TABLE pgmigration_triggers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  run_on TIMESTAMP(3) NOT NULL
);
