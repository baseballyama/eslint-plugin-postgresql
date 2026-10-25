import type { Linter } from "eslint";
import { parse } from "postgresql-eslint-parser";
import { PG_KEYWORDS_REQUIRING_QUOTES } from "../utils/pg-keywords.js";
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

/**
 * Name of the rule that reports parse failures. Matched without its plugin
 * prefix, since a flat config may register the plugin under any name.
 */
const SYNTAX_ERROR_RULE = "no-syntax-error";

const WHITESPACE = /\s/;
const WORD_PART = /[A-Za-z_]/;

/** SQL ending where only a parenthesized list can follow. */
const LIST_POSITION = /\b(?:IN|VALUES)\s*$/iu;
/**
 * SQL ending in `INSERT INTO <table>`, where a column list or rows follow. The
 * table name stops at `(`, so `INSERT INTO users(${columns})` is not matched.
 */
const INSERT_TARGET = /\bINSERT\s+INTO\s+[^\s(]+\s*$/iu;
const SET_POSITION = /\bSET\s*$/iu;
const SINGLE_SET_TARGET = /^\s*(?:=|TO\b)/iu;

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

/**
 * Openings of the ALTER TABLE sub-commands that begin with a statement
 * keyword: their first two words, or just the keyword for a bare
 * ``sql`DROP` `` or ``sql`SET` ``, as picked in
 * ``${nullable ? sql`DROP` : sql`SET`} NOT NULL``. No statement opens this
 * way, so a template that does is a fragment. `SET DATA TYPE` is left out,
 * since `SET data = ...` is a statement that sets a parameter.
 */
const SUBCOMMAND_OPENINGS = new Set([
  "ALTER COLUMN",
  "ALTER CONSTRAINT",
  "DROP",
  "DROP COLUMN",
  "DROP CONSTRAINT",
  "DROP DEFAULT",
  "DROP EXPRESSION",
  "DROP IDENTITY",
  "DROP NOT",
  "SET",
  "SET DEFAULT",
  "SET NOT",
]);

interface EmbeddedBlock {
  /** SQL text with every `${...}` swapped for an equal-length placeholder. */
  text: string;
  /** Offset in the host file of the first character of `text`. */
  start: number;
  /** Placeholder spans, as `[start, end)` offsets into `text`. */
  placeholders: OffsetRange[];
  /** Offset of each line start in `text`, for line/column → offset lookups. */
  lineStarts: number[];
  /** Offset of each line start in the host file, for offset → line/column. */
  hostLineStarts: number[];
  /**
   * Whether `text` fails to parse because of a placeholder, which makes its
   * syntax error our substitution's rather than the author's.
   */
  failsOnPlaceholder: boolean;
}

/**
 * The line breaks ESLint and `postgresql-eslint-parser` count. Positions are
 * mapped through offsets, so a line start we miss here would shift every
 * report after it.
 */
const LINE_BREAK = /\r\n|[\r\n\u2028\u2029]/gu;

const lineStartsOf = (text: string): number[] => {
  const starts = [0];
  for (const match of text.matchAll(LINE_BREAK)) {
    starts.push(match.index + match[0].length);
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
 * Where a bare identifier can never parse, a `${...}` has to expand to a list
 * or to assignments — the way postgres.js expands ``IN ${sql(ids)}``,
 * ``INSERT INTO users ${sql(user)}`` and ``UPDATE users SET ${sql(user)}`` —
 * so its placeholder takes that shape. Returns `null` everywhere else.
 */
const shapeFor = (
  name: string,
  before: string,
  after: string,
): string | null => {
  if (LIST_POSITION.test(before)) return `(${name})`;
  if (INSERT_TARGET.test(before)) return `VALUES(${name})`;
  // `SET ${column} = ...` and `SET ${parameter} TO ...` name a single target.
  if (SET_POSITION.test(before) && !SINGLE_SET_TARGET.test(after)) {
    return `${name}=${name}`;
  }
  return null;
};

/**
 * Builds the SQL that stands in for one `${...}`, given the block text before
 * it and the template text after it. It has to be exactly as wide as the span
 * it replaces so every offset in the block still lines up with the host file
 * — that is what keeps reported positions and autofix ranges usable without a
 * source map.
 */
const placeholderFor = (
  index: number,
  width: number,
  before: string,
  after: string,
): string | null => {
  const name = `_p${index}`;
  const shape = shapeFor(name, before, after);
  // A shape too wide for a short `${x}` falls back to the bare identifier,
  // which can still parse where an expression may follow IN, as in
  // `POSITION('a' IN ${s})`. Padding a shape with `_` would glue a stray
  // identifier onto its end.
  if (shape !== null && shape.length <= width) return shape.padEnd(width, " ");
  return name.length > width ? null : name.padEnd(width, "_");
};

/**
 * Offset of the first character at or after `from` that is neither whitespace
 * nor part of a comment, or `sql.length` when only those remain.
 */
const skipTrivia = (sql: string, from: number): number => {
  let i = from;
  while (i < sql.length) {
    const char = sql.charAt(i);
    if (WHITESPACE.test(char)) {
      i += 1;
      continue;
    }
    if (char === "-" && sql.charAt(i + 1) === "-") {
      const end = sql.indexOf("\n", i);
      if (end === -1) return sql.length;
      i = end + 1;
      continue;
    }
    if (char === "/" && sql.charAt(i + 1) === "*") {
      const end = sql.indexOf("*/", i + 2);
      if (end === -1) return sql.length;
      i = end + 2;
      continue;
    }
    break;
  }
  return i;
};

/**
 * First word of the SQL text from `from` on, upper-cased, skipping leading
 * whitespace and comments. Returns `null` when the text starts with something
 * that is not a word at all.
 */
const firstWordOf = (sql: string, from = 0): string | null => {
  const start = skipTrivia(sql, from);
  let end = start;
  while (end < sql.length && WORD_PART.test(sql.charAt(end))) end += 1;
  return end === start ? null : sql.slice(start, end).toUpperCase();
};

/**
 * Whether `sql` fails to parse because of a placeholder rather than the
 * author's SQL. A placeholder is an identifier, so where the `${...}` really
 * holds a clause or a list, the parser stops on the placeholder itself — or,
 * having accepted it as a name, right after it: at the end of the statement
 * (a `;` or nothing but comments may follow), as in
 * ``sql`SELECT * FROM a JOIN b ${on}` ``, or on a reserved word that
 * starts the next clause, as in ``sql`WITH ${ctes} SELECT ...` ``. Anything
 * else right after a placeholder, such as a stray comma or a misspelled
 * keyword, is the author's. An error the parser gives no position for cannot
 * be placed, so it is blamed on the placeholders too.
 */
const failsOnPlaceholder = (
  sql: string,
  placeholders: OffsetRange[],
): boolean => {
  const error = parse(sql).body.find((node) => node.type === "SQLParseError");
  if (error === undefined) return false;
  const index = error.errorPosition?.index;
  if (index === undefined) return true;
  const next = skipTrivia(sql, index);
  const startsClause =
    next === sql.length ||
    sql.charAt(next) === ";" ||
    PG_KEYWORDS_REQUIRING_QUOTES.has(
      firstWordOf(sql, next)?.toLowerCase() ?? "",
    );
  return placeholders.some(
    ([start, end]) =>
      start <= index &&
      (index < end || (startsClause && skipTrivia(sql, end) >= index)),
  );
};

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
    text += raw.slice(cursor, start);
    const placeholder = placeholderFor(
      placeholders.length,
      end - start,
      text,
      raw.slice(end),
    );
    // Only unreachable in practice: a template would need hundreds of
    // interpolations before `_p<n>` outgrows the shortest `${x}`.
    if (placeholder === null) return null;
    text += placeholder;
    placeholders.push([start, end]);
    cursor = end;
  }
  text += raw.slice(cursor);

  const firstWord = firstWordOf(text);
  if (firstWord === null || !STATEMENT_KEYWORDS.has(firstWord)) return null;
  // A keyword counts as bare only at the end of the template, since
  // `SET "app.id" = 1` is a statement.
  const next = skipTrivia(text, skipTrivia(text, 0) + firstWord.length);
  const opening =
    next === text.length
      ? firstWord
      : `${firstWord} ${firstWordOf(text, next) ?? ""}`;
  if (SUBCOMMAND_OPENINGS.has(opening)) return null;

  return {
    text,
    start: template.start,
    placeholders,
    lineStarts: lineStartsOf(text),
    hostLineStarts,
    // With placeholders in play a parse failure may be our substitution's
    // fault rather than the author's. Interpolation-free templates are passed
    // through unparsed, so every typo in them is reported.
    failsOnPlaceholder:
      placeholders.length > 0 && failsOnPlaceholder(text, placeholders),
  };
};

/**
 * Maps a block position into the host file through offsets, which line up by
 * construction. Lines do not: a placeholder has no line breaks, so one that
 * stands in for a multi-line `${...}` leaves the block with fewer lines.
 */
const translatePosition = (
  block: EmbeddedBlock,
  line: number,
  column: number,
): { line: number; column: number } => {
  const offset = block.start + offsetAt(block.lineStarts, line, column);
  const lineIndex = lineIndexOf(block.hostLineStarts, offset);
  return {
    line: lineIndex + 1,
    column: offset - (block.hostLineStarts[lineIndex] ?? 0) + 1,
  };
};

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
  // A block that fails to parse on a placeholder is still linted, because
  // rules that read tokens rather than the syntax tree (keyword case, `<>` or
  // `!=`) work without a parse. Only its syntax error is withheld: that
  // `${...}` holds a clause or a list, not a name.
  if (
    block.failsOnPlaceholder &&
    message.ruleId?.endsWith(`/${SYNTAX_ERROR_RULE}`) === true
  ) {
    return null;
  }

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
 * normally apply to it keep running — including type-aware ones.
 */
const embeddedSql: Linter.Processor<string | Linter.ProcessorFile> = {
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
      // The host file goes back as a bare string, not a named block. ESLint
      // lints a string block with the original options — same config, same
      // filename — so type-aware setups keep working: `projectService` still
      // sees the real path instead of a virtual one it cannot find in the
      // TypeScript program.
      text,
    ];
  },

  postprocess(messageLists, filename) {
    const blocks = blockCache.get(filename) ?? [];
    blockCache.delete(filename);

    const result: Linter.LintMessage[] = [];
    for (const [index, messages] of messageLists.entries()) {
      const block = blocks[index];
      if (block === undefined) {
        // The trailing list belongs to the host file, which was linted as
        // itself; its positions are already host positions.
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
