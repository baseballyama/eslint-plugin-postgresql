---
"eslint-plugin-postgresql": minor
---

**BREAKING**: Renamed `prefer-current-timestamp-over-now` to `consistent-current-timestamp-over-now` and added a `style` option so users can enforce either spelling with a single rule. `configs.stylistic` references the new name. The `style` option accepts:

- `"always"` (default): rewrite `now()` to `CURRENT_TIMESTAMP`. This is the original behavior of `prefer-current-timestamp-over-now`.
- `"never"`: rewrite `CURRENT_TIMESTAMP` to `now()`. `LOCALTIMESTAMP` is rewritten to `now()` as well. `CURRENT_TIMESTAMP(p)` is left alone, and `LOCALTIMESTAMP(p)` is rewritten to `CURRENT_TIMESTAMP(p)`, since `now()` takes no precision.

`LOCALTIME` is rewritten to `CURRENT_TIME` in both styles, as before.
