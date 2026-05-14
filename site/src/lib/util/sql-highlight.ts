/**
 * Lo-fi PostgreSQL highlighter shared by the static <SqlBlock /> renderer
 * and the live <Playground /> overlay. Tuned for the inputs that appear in
 * documentation and rule examples — not a full grammar, just enough to
 * carry visual structure (keywords, types, literals, comments).
 *
 * Returns escaped, span-wrapped HTML safe to inject with {@html}.
 */

const KEYWORDS = new Set([
  "ADD",
  "ALL",
  "ALTER",
  "ALWAYS",
  "AND",
  "AS",
  "ASC",
  "BEGIN",
  "BETWEEN",
  "BY",
  "CASCADE",
  "CASE",
  "CHECK",
  "COLUMN",
  "COMMIT",
  "CONSTRAINT",
  "CONCURRENTLY",
  "COUNT",
  "CREATE",
  "CROSS",
  "DEFAULT",
  "DELETE",
  "DESC",
  "DISTINCT",
  "DROP",
  "ELSE",
  "END",
  "EXCEPT",
  "EXISTS",
  "FALSE",
  "FETCH",
  "FOR",
  "FOREIGN",
  "FROM",
  "FULL",
  "GENERATED",
  "GRANT",
  "GROUP",
  "HAVING",
  "IDENTITY",
  "IF",
  "IN",
  "INDEX",
  "INNER",
  "INSERT",
  "INTERSECT",
  "INTO",
  "IS",
  "JOIN",
  "KEY",
  "LEFT",
  "LIMIT",
  "NATURAL",
  "NOT",
  "NULL",
  "OFFSET",
  "ON",
  "OR",
  "ORDER",
  "OUTER",
  "PRIMARY",
  "PRECISION",
  "PUBLIC",
  "REFERENCES",
  "RESTRICT",
  "RETURNING",
  "REVOKE",
  "RIGHT",
  "ROLLBACK",
  "SELECT",
  "SET",
  "TABLE",
  "THEN",
  "TO",
  "TRUE",
  "TRUNCATE",
  "UNION",
  "UNIQUE",
  "UPDATE",
  "USING",
  "VALUES",
  "WHEN",
  "WHERE",
  "WITH",
]);

const TYPES = new Set([
  "BIGINT",
  "BIGSERIAL",
  "BIT",
  "BOOL",
  "BOOLEAN",
  "BPCHAR",
  "BYTEA",
  "CHAR",
  "DATE",
  "DECIMAL",
  "DOUBLE",
  "INT",
  "INTEGER",
  "INTERVAL",
  "JSON",
  "JSONB",
  "MONEY",
  "NUMERIC",
  "REAL",
  "SERIAL",
  "SMALLINT",
  "SMALLSERIAL",
  "TEXT",
  "TIME",
  "TIMESTAMP",
  "TIMESTAMPTZ",
  "UUID",
  "VARCHAR",
]);

const TOKEN_RE =
  /(--[^\n]*)|(\/\*[\s\S]*?\*\/)|('(?:''|[^'])*')|("[^"]*")|(\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|([^\s\w]+)/g;

function esc(s: string): string {
  return s.replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!,
  );
}

export function highlightSql(input: string): string {
  TOKEN_RE.lastIndex = 0;
  let out = "";
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = TOKEN_RE.exec(input)) !== null) {
    if (m.index > last) out += esc(input.slice(last, m.index));
    const [tok] = m;
    if (m[1] || m[2]) {
      out += `<span class="sql-cmt">${esc(tok)}</span>`;
    } else if (m[3] || m[4]) {
      out += `<span class="sql-str">${esc(tok)}</span>`;
    } else if (m[5]) {
      out += `<span class="sql-num">${esc(tok)}</span>`;
    } else if (m[6]) {
      const up = tok.toUpperCase();
      if (KEYWORDS.has(up)) out += `<span class="sql-kw">${esc(tok)}</span>`;
      else if (TYPES.has(up))
        out += `<span class="sql-type">${esc(tok)}</span>`;
      else out += `<span class="sql-id">${esc(tok)}</span>`;
    } else if (m[7]) {
      out += tok;
    } else {
      out += esc(tok);
    }
    last = TOKEN_RE.lastIndex;
  }
  if (last < input.length) out += esc(input.slice(last));
  // Trailing newline must be preserved so the overlay <pre>'s line count
  // matches the textarea's. The browser collapses a final newline in <pre>
  // unless something follows it.
  if (input.endsWith("\n")) out += "\n";
  return out;
}
