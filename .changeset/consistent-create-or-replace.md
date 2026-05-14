---
"eslint-plugin-postgresql": minor
---

**BREAKING**: Renamed `prefer-create-or-replace` to `consistent-create-or-replace` and added a `style` option so users can enforce either stance with a single rule. The `style` option accepts:

- `"always"` (default): require `OR REPLACE` on `CREATE FUNCTION` / `PROCEDURE` / `VIEW` so re-running a migration is idempotent. This is the original behavior of `prefer-create-or-replace`.
- `"never"`: forbid `OR REPLACE` so unintended overwrites surface as `relation already exists` and must be addressed explicitly.

Both styles are auto-fixable: `always` inserts ` OR REPLACE` after `CREATE`; `never` removes the ` OR REPLACE` keywords.

Migration:

```diff
- "postgresql/prefer-create-or-replace": "warn"
+ "postgresql/consistent-create-or-replace": ["warn", { "style": "always" }]
```

The previous rule was off by default in `configs.recommended`, so users not configuring it explicitly are unaffected. The `messageId` `preferOrReplace` is preserved for the `always` style; the new `unexpectedOrReplace` covers the `never` style.
