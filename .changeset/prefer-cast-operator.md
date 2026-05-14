---
"eslint-plugin-postgresql": minor
---

Add `postgresql/prefer-cast-operator` (in `configs.stylistic`,
auto-fixable).

Enforces a single style for type casts: defaults to the operator form
(`x::integer`), pass `["error", { "form": "function" }]` to flip to
`CAST(x AS integer)`.

The rule walks the token stream after detecting the cast's source form
(the token at the `TypeCast` node's location is either `CAST` or
`::`), so qualified type names (`schema.type`) and parameterized types
(`numeric(10, 2)`) are handled without depending on the parser's
partial `typeName.range`.
