---
"eslint-plugin-postgresql": minor
---

**BREAKING**: Renamed `prefer-timestamptz` to `consistent-timestamptz` and added a `style` option so users can enforce either stance with a single rule. The `style` option accepts:

- `"always"` (default): require `timestamptz` over `timestamp` so the database anchors everything to UTC at storage time. This is the original behavior of `prefer-timestamptz`.
- `"never"`: require `timestamp` over `timestamptz` — useful for projects that treat every timestamp as UTC at the application layer and want to avoid the implicit per-session `TimeZone` conversions `timestamptz` performs.

Migration:

```diff
- "postgresql/prefer-timestamptz": "warn"
+ "postgresql/consistent-timestamptz": ["warn", { "style": "always" }]
```

`configs.recommended` continues to enable the rule at `warn` with the `always` default, so users on the recommended preset are unaffected. The `messageId` `preferTimestamptz` is preserved for the `always` style; the new `unexpectedTimestamptz` covers the `never` style.
