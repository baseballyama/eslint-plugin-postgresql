---
"eslint-plugin-postgresql": minor
---

Add `configs.all`: every rule the plugin ships, enabled at `error`.
Built mechanically from `plugin.rules`, so any rule added later is
automatically included. Intended for users who want to audit the full
catalog and turn off only what they actively don't want.
