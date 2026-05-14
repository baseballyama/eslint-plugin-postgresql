---
"eslint-plugin-postgresql": minor
---

**BREAKING**: Renamed `prefer-create-index-concurrently` to `consistent-create-index-concurrently` and added a `style` option so users can enforce either stance with a single rule. The `style` option accepts:

- `"always"` (default): require `CONCURRENTLY` on `CREATE INDEX` so the build doesn't take a table-level `SHARE` lock that blocks writers. This is the original behavior of `prefer-create-index-concurrently`.
- `"never"`: forbid `CONCURRENTLY` so each `CREATE INDEX` can run inside a migration transaction (concurrent index builds cannot run inside `BEGIN`/`COMMIT`).

Migration:

```diff
- "postgresql/prefer-create-index-concurrently": "warn"
+ "postgresql/consistent-create-index-concurrently": ["warn", { "style": "always" }]
```

The previous rule was off by default in `configs.recommended`, so users not configuring it explicitly are unaffected. The `messageId` `preferConcurrently` is preserved for the `always` style; the new `unexpectedConcurrently` covers the `never` style.
