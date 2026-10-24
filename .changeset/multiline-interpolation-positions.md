---
"eslint-plugin-postgresql": patch
---

The `embedded-sql` processor now reports at the right line and column after
an interpolation that spans several lines, such as an object literal written
across several lines. Before, the interpolation's line breaks were dropped:
text on the line where it closed was reported on the line where it opened, at
a column past the end of that line, and every later line was reported one
line higher per line break.

Lines are now also counted the way ESLint counts them, so a lone `\r` or a
U+2028 / U+2029 line separator, inside the SQL or earlier in the file, no
longer shifts reported lines.
