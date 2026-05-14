---
"eslint-plugin-postgresql": patch
---

Docs site catalog now covers every shipped rule, with options documented
for rules that take them. A new smoke test asserts that every entry in
`plugin.rules` has a matching entry in `site/src/lib/data/rules.ts`, so
adding a rule without updating the catalog now fails CI.
