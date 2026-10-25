/**
 * A `[start, end)` pair of offsets into the scanned source.
 */
export type OffsetRange = [number, number];

export interface TaggedTemplate {
  /** Offset of the first character after the opening backtick. */
  start: number;
  /** Offset of the closing backtick. */
  end: number;
  /** `${...}` spans inside the template, in source order. */
  interpolations: OffsetRange[];
}

interface TemplateFrame {
  kind: "template";
  /** The code frame the opening backtick was found in. */
  parent: Frame;
  tagged: boolean;
  start: number;
  interpolations: OffsetRange[];
  openInterpolation: number | null;
}

/**
 * A `(`, or a `<` after a member path, not yet closed. Call and type arguments
 * can sit between a tag and its backtick, as in ``sql.type(schema)`...` `` and
 * ``sql<Row[]>`...` ``, so each bracket sets aside the path before it for its
 * close to restore.
 */
interface Bracket {
  close: ")" | ">";
  path: string | null;
}

interface CodeFrame {
  kind: "code";
  /** The template whose `${` opened this frame; `null` at the top level. */
  parent: TemplateFrame | null;
  braceDepth: number;
  /** Brackets open in this frame, innermost last. */
  brackets: Bracket[];
}

type Frame = TemplateFrame | CodeFrame;

const IDENT_START = /[A-Za-z_$]/;
const IDENT_PART = /[A-Za-z0-9_$]/;
const WHITESPACE = /\s/;

/**
 * Keywords after which a `/` starts a regular expression literal rather than
 * a division operator. Without them, `return /['"]/` would be scanned as a
 * division followed by an unterminated string.
 */
const REGEX_PRECEDING_KEYWORDS = new Set([
  "await",
  "case",
  "delete",
  "do",
  "else",
  "in",
  "instanceof",
  "new",
  "of",
  "return",
  "throw",
  "typeof",
  "void",
  "yield",
]);

/** Punctuators after which a `/` starts a regular expression literal. */
const REGEX_PRECEDING_PUNCTUATORS = new Set([
  "!",
  "%",
  "&",
  "(",
  "*",
  "+",
  ",",
  "-",
  ":",
  ";",
  "<",
  "=",
  ">",
  "?",
  "[",
  "^",
  "{",
  "|",
  "}",
  "~",
]);

const regexCanFollow = (token: string): boolean =>
  token === "" ||
  REGEX_PRECEDING_PUNCTUATORS.has(token) ||
  REGEX_PRECEDING_KEYWORDS.has(token);

const skipLineComment = (code: string, start: number): number => {
  const end = code.indexOf("\n", start);
  return end === -1 ? code.length : end;
};

const skipBlockComment = (code: string, start: number): number => {
  const end = code.indexOf("*/", start + 2);
  return end === -1 ? code.length : end + 2;
};

/**
 * Skips a `'`- or `"`-quoted string. An unterminated quote resyncs at the
 * line break, so JSX text such as `<p>don't</p>` costs us the rest of that
 * line instead of the rest of the file.
 */
const skipQuoted = (code: string, start: number): number => {
  const quote = code.charAt(start);
  let i = start + 1;
  while (i < code.length) {
    const char = code.charAt(i);
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === quote) return i + 1;
    if (char === "\n") return i;
    i += 1;
  }
  return i;
};

const skipRegex = (code: string, start: number): number => {
  let i = start + 1;
  let inCharacterClass = false;
  while (i < code.length) {
    const char = code.charAt(i);
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === "[") inCharacterClass = true;
    else if (char === "]") inCharacterClass = false;
    else if (char === "/" && !inCharacterClass) return i + 1;
    else if (char === "\n") return i;
    i += 1;
  }
  return i;
};

/**
 * Finds every ``tag`...` `` template literal in JavaScript or TypeScript
 * source whose tag `isSqlTag` accepts, along with the `${...}` spans inside it.
 *
 * `isSqlTag` is given the tag's member path: its identifiers joined by `.`,
 * without call or type arguments. ``prisma.$queryRaw`...` `` gives
 * `prisma.$queryRaw`, ``sql<Row[]>`...` `` gives `sql`, and
 * ``sql.type(schema)`...` `` gives `sql.type`.
 *
 * This is a lexer, not a parser: it tracks strings, comments, regular
 * expressions and nested template literals so a backtick inside any of them
 * is never mistaken for a template. It deliberately does not understand JSX —
 * an apostrophe in JSX text desynchronises the scan until the next line
 * break, which loses templates rather than inventing them.
 */
export const extractTaggedTemplates = (
  code: string,
  isSqlTag: (path: string) => boolean,
): TaggedTemplate[] => {
  const found: TaggedTemplate[] = [];
  let frame: Frame = {
    kind: "code",
    parent: null,
    braceDepth: 0,
    brackets: [],
  };
  let lastToken = "";
  /**
   * The member path the last token ends, such as `prisma.$queryRaw`, or
   * `null` when it ends none. Always `null` inside a template.
   */
  let path: string | null = null;
  let i = 0;

  while (i < code.length) {
    const char = code.charAt(i);

    if (frame.kind === "template") {
      if (char === "\\") {
        i += 2;
        continue;
      }
      if (char === "`") {
        if (frame.tagged) {
          found.push({
            start: frame.start,
            end: i,
            interpolations: frame.interpolations,
          });
        }
        frame = frame.parent;
        lastToken = "`";
        i += 1;
        continue;
      }
      if (char === "$" && code.charAt(i + 1) === "{") {
        frame.openInterpolation = i;
        frame = { kind: "code", parent: frame, braceDepth: 0, brackets: [] };
        lastToken = "";
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }

    if (char === "/" && code.charAt(i + 1) === "/") {
      i = skipLineComment(code, i);
      continue;
    }
    if (char === "/" && code.charAt(i + 1) === "*") {
      i = skipBlockComment(code, i);
      continue;
    }
    if (WHITESPACE.test(char)) {
      i += 1;
      continue;
    }

    const pathBefore: string | null = path;
    path = null;

    if (char === '"' || char === "'") {
      i = skipQuoted(code, i);
      lastToken = char;
      continue;
    }
    if (char === "/" && regexCanFollow(lastToken)) {
      i = skipRegex(code, i);
      lastToken = "/";
      continue;
    }
    if (char === "`") {
      frame = {
        kind: "template",
        parent: frame,
        tagged: pathBefore !== null && isSqlTag(pathBefore),
        start: i + 1,
        interpolations: [],
        openInterpolation: null,
      };
      i += 1;
      continue;
    }
    if (IDENT_START.test(char)) {
      const identStart = i;
      i += 1;
      while (i < code.length && IDENT_PART.test(code.charAt(i))) i += 1;
      const identifier = code.slice(identStart, i);
      if (lastToken === ".") {
        path = pathBefore === null ? identifier : `${pathBefore}.${identifier}`;
      } else if (!REGEX_PRECEDING_KEYWORDS.has(identifier)) {
        // A template right after `return` or `await` is untagged, so those
        // keywords start no path.
        path = identifier;
      }
      lastToken = identifier;
      continue;
    }
    if (char === "{") {
      frame.braceDepth += 1;
      lastToken = char;
      i += 1;
      continue;
    }
    if (char === "}") {
      const template: TemplateFrame | null = frame.parent;
      // Depth 0 inside a pushed frame means this `}` closes the `${` that
      // opened it, so control returns to the enclosing template.
      if (frame.braceDepth === 0 && template !== null) {
        if (template.openInterpolation !== null) {
          template.interpolations.push([template.openInterpolation, i + 1]);
          template.openInterpolation = null;
        }
        frame = template;
      } else {
        frame.braceDepth -= 1;
      }
      lastToken = "}";
      i += 1;
      continue;
    }
    if (char === ".") {
      path = pathBefore;
    } else if (char === "(") {
      frame.brackets.push({ close: ")", path: pathBefore });
    } else if (char === ")") {
      // A `<` still open here was a less-than, as in `if (a < b)`.
      let bracket = frame.brackets.pop();
      while (bracket?.close === ">") bracket = frame.brackets.pop();
      path = bracket?.path ?? null;
    } else if (char === "<" && pathBefore !== null) {
      frame.brackets.push({ close: ">", path: pathBefore });
    } else if (
      char === ">" &&
      frame.brackets.at(-1)?.close === ">" &&
      // The `>` of an arrow, as in `sql<() => Row>` or a later `() => ...`,
      // closes nothing.
      code.charAt(i - 1) !== "="
    ) {
      path = frame.brackets.pop()!.path;
    }

    lastToken = char;
    i += 1;
  }

  // Templates nested inside an interpolation close before their parent, so
  // source order has to be restored for the caller.
  return found.sort((a, b) => a.start - b.start);
};
