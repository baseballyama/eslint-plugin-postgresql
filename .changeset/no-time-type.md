---
"eslint-plugin-postgresql": minor
---

Add `postgresql/no-time-type` rule: warns on `TIME` and `TIME WITH TIME ZONE` (`timetz`) columns because they rarely model real-world values correctly. Use `timestamptz` for points in time, `interval` for durations, or `text` for a display value. Enabled at `warn` severity in `configs.recommended`.
