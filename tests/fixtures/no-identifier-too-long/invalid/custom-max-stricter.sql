-- With `max: 10`, the 11-byte table name `looong_table` exceeds the limit.
CREATE TABLE looong_table (
  id BIGSERIAL PRIMARY KEY
);
