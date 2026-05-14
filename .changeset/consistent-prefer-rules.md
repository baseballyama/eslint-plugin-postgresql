---
"eslint-plugin-postgresql": minor
---

**BREAKING**: Renamed 11 `prefer-*` rules to `consistent-*` and added a `style: "always" | "never"` option so each can enforce either stance. The `"always"` default preserves the original behavior; `"never"` enforces the opposite.

| Before                           | After                                |
| -------------------------------- | ------------------------------------ |
| `prefer-as-for-column-alias`     | `consistent-as-for-column-alias`     |
| `prefer-as-for-table-alias`      | `consistent-as-for-table-alias`      |
| `prefer-between-over-and`        | `consistent-between-over-and`        |
| `prefer-drop-index-concurrently` | `consistent-drop-index-concurrently` |
| `prefer-explicit-inner-join`     | `consistent-explicit-inner-join`     |
| `prefer-explicit-outer-join`     | `consistent-explicit-outer-join`     |
| `prefer-fk-not-valid`            | `consistent-fk-not-valid`            |
| `prefer-identity-over-serial`    | `consistent-identity-over-serial`    |
| `prefer-jsonb-over-json`         | `consistent-jsonb-over-json`         |
| `prefer-reindex-concurrently`    | `consistent-reindex-concurrently`    |
| `prefer-text-over-varchar`       | `consistent-text-over-varchar`       |

Migration:

```diff
- "postgresql/prefer-fk-not-valid": "warn"
+ "postgresql/consistent-fk-not-valid": ["warn", { "style": "always" }]
```

The original `preferX` messageId is kept for the `"always"` style; an `unexpectedX` messageId is added for the `"never"` style. `consistent-between-over-and` is now auto-fixable in both directions (it was previously only emitted as a suggestion). `configs.recommended` and `configs.stylistic` reference the new rule names, so users on those presets are unaffected.

In addition, `require-on-delete-action` gains an `allowed` option that lists the action keywords accepted by the rule. When set, the rule additionally fails if the `ON DELETE` action is not in the list — useful for projects that want to bake "no cascading deletes" into the lint config:

```js
"postgresql/require-on-delete-action": [
  "warn",
  { "allowed": ["RESTRICT", "NO ACTION", "SET NULL"] }
]
```
