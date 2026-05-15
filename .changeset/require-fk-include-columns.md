---
"eslint-plugin-postgresql": minor
---

Add `require-fk-include-columns` rule that requires every foreign-key constraint to include a configured set of columns. The primary use case is multi-tenant schemas where every FK must carry the tenant key (e.g. `tenant_id`) so a child row cannot point at a parent row that lives in a different tenant. The rule inspects inline column-level FKs, table-level FKs in `CREATE TABLE`, and `ALTER TABLE ADD CONSTRAINT ... FOREIGN KEY`. Three options: `columns` (the required column names, mandatory), `excludeTablePattern` (regex; skip FKs on matching tables, e.g. audit / log tables), and `excludeReferencedTablePattern` (regex; skip FKs whose `REFERENCES` target matches, typically the tenant table itself and other global lookup tables). Off by default because the project-specific column list has no sensible default.
