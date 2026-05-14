-- Regression test for #136: SET ... = NULL is rejected by libpg-query.
-- The rule must skip parse-error stmts so autofix does not append a
-- run of `;` characters to the file.
SET LOCAL app.admin = 'true';
SET plv8.start_proc = NULL;
