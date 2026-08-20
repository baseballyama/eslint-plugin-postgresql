import type { Linter } from "eslint";
import { parse } from "postgresql-eslint-parser";
import {
  extractTaggedTemplates,
  type OffsetRange,
  type TaggedTemplate,
} from "./extract-tagged-templates.js";

/**
 * Template tags treated as SQL. `sql` is what Drizzle, Kysely and postgres.js
 * export; `$queryRaw` / `$executeRaw` are Prisma's raw-query tags, reached
 * through `prisma.$queryRaw`.
 *
 * Tags that are not a plain identifier are out of reach — Prisma's
 * `$queryRawUnsafe("...")` and TypeORM's `.query("...")` take a string
 * argument rather than a template, and modern slonik tags with
 * `sql.type(schema)` whose last token is a `)`.
 */
const SQL_TAGS: ReadonlySet<string> = new Set([
  "sql",
  "$queryRaw",
  "$executeRaw",
]);

/** Extension given to the virtual files carved out of the host file. */
const VIRTUAL_EXTENSION = ".sql";

const WHITESPACE = /\s/;
const WORD_PART = /[A-Za-z_]/;

/**
 * Keywords that can begin a complete PostgreSQL statement. A `sql` template
 * that starts with anything else is an expression fragment — ``sql`excluded.id` ``,
 * ``sql`${col} IS NULL` `` — which has no standalone parse, so it is never
 * turned into a virtual file.
 */
const STATEMENT_KEYWORDS = new Set([
  "ABORT",
  "ALTER",
  "ANALYZE",
  "BEGIN",
  "CALL",
  "CHECKPOINT",
  "CLOSE",
  "CLUSTER",
  "COMMENT",
  "COMMIT",
  "COPY",
  "CREATE",
  "DEALLOCATE",
  "DECLARE",
  "DELETE",
  "DISCARD",
  "DO",
  "DROP",
  "EXECUTE",
  "EXPLAIN",
  "FETCH",
  "GRANT",
  "IMPORT",
  "INSERT",
  "LISTEN",
  "LOAD",
  "LOCK",
  "MERGE",
  "MOVE",
  "NOTIFY",
  "PREPARE",
  "REASSIGN",
  "REFRESH",
  "REINDEX",
  "RELEASE",
  "RESET",
  "REVOKE",
  "ROLLBACK",
  "SAVEPOINT",
  "SELECT",
  "SET",
  "SHOW",
  "START",
  "TRUNCATE",
  "UNLISTEN",
  "UPDATE",
  "VACUUM",
  "WITH",
]);

interface EmbeddedBlock {
  /** SQL text with every `${...}` swapped for an equal-length placeholder. */
  text: string;
  /** Offset in the host file of the first character of `text`. */
  start: number;
  /** 1-based line in the host file of `start`. */
  startLine: number;
  /** 0-based column in the host file of `start`. */
  startColumn: number;
  /** Placeholder spans, as `[start, end)` offsets into `text`. */
  placeholders: OffsetRange[];
  /** Offset of each line start in `text`, for line/column → offset lookups. */
  lineStarts: number[];
}

const lineStartsOf = (text: string): number[] => {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text.charAt(i) === "\n") starts.push(i + 1);
  }
  return starts;
};

/** Index of the line containing `offset`, via binary search over line starts. */
const lineIndexOf = (lineStarts: number[], offset: number): number => {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if ((lineStarts[mid] ?? 0) <= offset) low = mid;
    else high = mid - 1;
  }
  return low;
};

const offsetAt = (lineStarts: number[], line: number, column: number): number =>
  (lineStarts[line - 1] ?? 0) + column - 1;

/**
 * Builds the identifier that stands in for one `${...}`. It has to be exactly
 * as wide as the span it replaces so every offset in the block still lines up
 * with the host file — that is what keeps reported positions and autofix
 * ranges usable without a source map.
 */
const placeholderFor = (index: number, width: number): string | null => {
  const base = `_p${index}`;
  return base.length > width ? null : base.padEnd(width, "_");
};

/**
 * First word of the SQL text, upper-cased, skipping leading whitespace and
 * comments. Returns `null` when the text starts with something that is not a
 * word at all.
 */
const firstWordOf = (sql: string): string | null => {
  let i = 0;
  while (i < sql.length) {
    const char = sql.charAt(i);
    if (WHITESPACE.test(char)) {
      i += 1;
      continue;
    }
    if (char === "-" && sql.charAt(i + 1) === "-") {
      const end = sql.indexOf("\n", i);
      if (end === -1) return null;
      i = end + 1;
      continue;
    }
    if (char === "/" && sql.charAt(i + 1) === "*") {
      const end = sql.indexOf("*/", i + 2);
      if (end === -1) return null;
      i = end + 2;
      continue;
    }
    break;
  }
  let end = i;
  while (end < sql.length && WORD_PART.test(sql.charAt(end))) end += 1;
  return end === i ? null : sql.slice(i, end).toUpperCase();
};

const hasParseError = (sql: string): boolean =>
  parse(sql).body.some((node) => node.type === "SQLParseError");

const buildBlock = (
  code: string,
  template: TaggedTemplate,
  hostLineStarts: number[],
): EmbeddedBlock | null => {
  const raw = code.slice(template.start, template.end);

  // The template's raw source and its cooked value diverge once an escape is
  // involved (`'\\'` is two characters in the file but one in the string that
  // reaches PostgreSQL). Linting the raw text would report on SQL that never
  // runs, so these templates are left alone.
  if (raw.includes("\\")) return null;

  const placeholders: OffsetRange[] = [];
  let text = "";
  let cursor = 0;
  for (const [absoluteStart, absoluteEnd] of template.interpolations) {
    const start = absoluteStart - template.start;
    const end = absoluteEnd - template.start;
    const placeholder = placeholderFor(placeholders.length, end - start);
    // Only unreachable in practice: a template would need hundreds of
    // interpolations before `_p<n>` outgrows the shortest `${x}`.
    if (placeholder === null) return null;
    text += raw.slice(cursor, start) + placeholder;
    placeholders.push([start, end]);
    cursor = end;
  }
  text += raw.slice(cursor);

  const firstWord = firstWordOf(text);
  if (firstWord === null || !STATEMENT_KEYWORDS.has(firstWord)) return null;

  // With placeholders in play a parse failure may be our substitution's fault
  // rather than the author's, and we cannot tell the two apart — so drop the
  // block instead of reporting a syntax error we do not stand behind.
  // Interpolation-free templates are passed through unparsed precisely so
  // `no-syntax-error` still sees genuine typos.
  if (placeholders.length > 0 && hasParseError(text)) return null;

  const lineIndex = lineIndexOf(hostLineStarts, template.start);
  return {
    text,
    start: template.start,
    startLine: lineIndex + 1,
    startColumn: template.start - (hostLineStarts[lineIndex] ?? 0),
    placeholders,
    lineStarts: lineStartsOf(text),
  };
};

const translatePosition = (
  block: EmbeddedBlock,
  line: number,
  column: number,
): { line: number; column: number } => ({
  line: block.startLine + line - 1,
  // Only the first line of the block is indented by the host file; later
  // lines start at column 1 in both coordinate systems.
  column: line === 1 ? block.startColumn + column : column,
});

const overlapsPlaceholder = (
  placeholders: OffsetRange[],
  start: number,
  end: number,
): boolean => placeholders.some(([from, to]) => start < to && end > from);

/**
 * Moves an edit from block coordinates into host-file coordinates, dropping
 * it when it cannot be applied there: rewriting a placeholder would corrupt
 * the author's expression, and a replacement containing a backtick or `${`
 * would end the template early.
 */
const translateFix = (
  fix: Linter.LintMessage["fix"],
  block: EmbeddedBlock,
): Linter.LintMessage["fix"] => {
  if (fix === undefined) return undefined;
  const [from, to] = fix.range;
  if (
    overlapsPlaceholder(block.placeholders, from, to) ||
    fix.text.includes("`") ||
    fix.text.includes("${")
  ) {
    return undefined;
  }
  return { range: [block.start + from, block.start + to], text: fix.text };
};

const translateMessage = (
  message: Linter.LintMessage,
  block: EmbeddedBlock,
): Linter.LintMessage | null => {
  const anchor = offsetAt(block.lineStarts, message.line, message.column);
  // A placeholder is not code the author wrote, so anything anchored inside
  // one (a too-long identifier, a casing complaint) is our artefact.
  if (overlapsPlaceholder(block.placeholders, anchor, anchor + 1)) return null;

  const start = translatePosition(block, message.line, message.column);
  const translated: Linter.LintMessage = {
    ...message,
    line: start.line,
    column: start.column,
  };

  if (message.endLine !== undefined && message.endColumn !== undefined) {
    const end = translatePosition(block, message.endLine, message.endColumn);
    translated.endLine = end.line;
    translated.endColumn = end.column;
  }

  const fix = translateFix(message.fix, block);
  if (fix === undefined) delete translated.fix;
  else translated.fix = fix;

  // Suggestions carry their own edits. Left alone they would point into the
  // block, and an editor applying one would rewrite the wrong bytes.
  if (message.suggestions !== undefined) {
    const suggestions = message.suggestions.flatMap((suggestion) => {
      const suggestionFix = translateFix(suggestion.fix, block);
      return suggestionFix === undefined
        ? []
        : [{ ...suggestion, fix: suggestionFix }];
    });
    if (suggestions.length === 0) delete translated.suggestions;
    else translated.suggestions = suggestions;
  }

  return translated;
};

const extensionOf = (filename: string): string => {
  const dot = filename.lastIndexOf(".");
  const separator = Math.max(
    filename.lastIndexOf("/"),
    filename.lastIndexOf("\\"),
  );
  return dot > separator + 1 ? filename.slice(dot) : "";
};

/**
 * Blocks carved out of the file currently being linted, keyed by filename so
 * `postprocess` can map each message list back. ESLint always pairs one
 * `postprocess` with one `preprocess`, and the entry is dropped on the way
 * out.
 */
const blockCache = new Map<string, EmbeddedBlock[]>();

/**
 * Lints the SQL inside ``sql`...` `` template literals in JavaScript and
 * TypeScript files — the form Drizzle, postgres.js and slonik use — by
 * emitting one virtual `.sql` file per complete statement.
 *
 * The host file is emitted alongside them, unchanged, so the rules that
 * normally apply to it keep running.
 */
const embeddedSql: Linter.Processor<Linter.ProcessorFile> = {
  meta: {
    name: "postgresql/embedded-sql",
    version: "1",
  },
  supportsAutofix: true,

  preprocess(text, filename) {
    const hostLineStarts = lineStartsOf(text);
    const blocks: EmbeddedBlock[] = [];
    for (const template of extractTaggedTemplates(text, SQL_TAGS)) {
      const block = buildBlock(text, template, hostLineStarts);
      if (block !== null) blocks.push(block);
    }
    blockCache.set(filename, blocks);

    return [
      ...blocks.map((block, index) => ({
        text: block.text,
        filename: `${index}${VIRTUAL_EXTENSION}`,
      })),
      // Same text and same extension as the host file, which is how ESLint
      // knows to lint it with the host's own config instead of resolving a
      // new one (and re-entering this processor).
      { text, filename: `${blocks.length}${extensionOf(filename)}` },
    ];
  },

  postprocess(messageLists, filename) {
    const blocks = blockCache.get(filename) ?? [];
    blockCache.delete(filename);

    const result: Linter.LintMessage[] = [];
    for (const [index, messages] of messageLists.entries()) {
      const block = blocks[index];
      if (block === undefined) {
        // The trailing list belongs to the host file; its positions are
        // already host positions.
        result.push(...messages);
        continue;
      }
      for (const message of messages) {
        const translated = translateMessage(message, block);
        if (translated !== null) result.push(translated);
      }
    }
    return result;
  },
};

export default embeddedSql;
