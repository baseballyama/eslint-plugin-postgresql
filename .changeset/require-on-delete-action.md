---
"eslint-plugin-postgresql": minor
---

Add `postgresql/require-on-delete-action` (in `configs.recommended` at
`warn`). Companion to `no-on-delete-cascade`: requires every foreign-key
constraint to spell out an explicit `ON DELETE` clause. The implicit
default is `NO ACTION`, but making the choice visible at constraint
definition time means reviewers can see whether an FK's intent is to
restrict, set null, or just default — instead of guessing.

Detection is token-based: AST's `fk_del_action === 'a'` does not
distinguish "no clause written" from "explicit `ON DELETE NO ACTION`",
so the rule walks the constraint's source span and reports if no
`ON DELETE` keyword pair appears at paren-depth 0.
