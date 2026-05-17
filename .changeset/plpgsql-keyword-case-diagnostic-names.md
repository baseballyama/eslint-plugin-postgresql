---
"eslint-plugin-postgresql": patch
---

Fix `plpgsql-keyword-case` false positives on `GET DIAGNOSTICS` item names used as regular identifiers. The rule was unconditionally flagging `row_count`, `column_name`, `table_name`, `schema_name`, `message_text`, `constraint_name`, `returned_sqlstate`, `pg_context`, `pg_datatype_name`, `pg_exception_context`, `pg_exception_detail`, and `pg_exception_hint` as keywords — but PostgreSQL only treats these as keywords on the right-hand side of `GET [STACKED] DIAGNOSTICS ... = `. Anywhere else (variable names in `DECLARE`, target of `SELECT INTO`, branch conditions, `information_schema` column references) they are ordinary identifiers, so the rule no longer reports them outside `GET DIAGNOSTICS` statements.
