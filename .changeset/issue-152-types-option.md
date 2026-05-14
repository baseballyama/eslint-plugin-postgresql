---
"eslint-plugin-postgresql": minor
---

`postgresql/prefer-keyword-case` gains a `types` option for casing
built-in type-name keywords (`text`, `int`, `bigint`, `numeric`, ...).

```jsonc
{
  "rules": {
    "postgresql/prefer-keyword-case": [
      "error",
      { "case": "upper", "types": "upper" },
    ],
  },
}
```

Values:

- `"skip"` (default) — leave type-name keywords alone, current 0.7.0
  behavior. Avoids mixed casing in signatures that mix built-ins with
  user-defined identifiers (#145).
- `"upper"` — force type names to uppercase across all positions
  (column defs, function args, casts, ...).
- `"lower"` — force type names to lowercase across all positions.

Closes the enhancement portion of #152: projects whose convention is
"all type references one case, everywhere" can now opt in.
