---
"eslint-plugin-postgresql": patch
---

`postgresql/consistent-as-for-column-alias`: stop corrupting compound value expressions when adding `AS`.

For values like `expr::type`, `table.col`, or `CASE WHEN … END`, the parser-reported `range[1]` for the value sometimes stops in the middle of the expression (e.g. between `::` and the type name, or right after the first dotted segment). The rule used to look at the token immediately after that range and, when it was not `AS`, insert `AS ` there — corrupting the SQL into `()::AS ulid …`, `uAS .col`, `CASE AS WHEN …`. ESLint's `--fix` loop then re-parsed and applied other fixes on top of the broken SQL.

The fix only inserts `AS` when the token immediately after the value range actually matches the alias identifier (`target.name`, comparing the raw token text and the unquoted form of a double-quoted identifier). When the parser range is too narrow and the next token is part of the value expression, the rule now skips instead of corrupting the source. The trade-off is a false negative on compound expressions that genuinely omit `AS`, which is strictly safer than the previous false fix.
