-- NOT NULL on a column is allowed without an explicit name.
CREATE TABLE items (id int PRIMARY KEY, code text NOT NULL);
