import type { AST } from "eslint";
import type { RuleModule } from "../utils/rule.js";
import type { Ast } from "postgresql-eslint-parser";
import { getFullSourceRange, isResTarget } from "../utils/ast.js";
import { PG_AS_LABEL_KEYWORDS } from "../utils/pg-keywords.js";

type Style = "always" | "never";

const DEFAULT_STYLE: Style = "always";

const OPENING_BRACKETS: ReadonlySet<string> = new Set(["(", "["]);
const CLOSING_BRACKETS: ReadonlySet<string> = new Set([")", "]"]);

// Keywords that kwlist.h allows as a bare column alias, but that can also
// continue the expression before them, so dropping `AS` breaks the query:
// `SELECT x + y AS at` parses, `SELECT x + y at` does not (`at` would start
// `AT TIME ZONE`). Found by parsing `SELECT <expr> <keyword>` with
// libpg-query for every BARE_LABEL keyword; most of them carry their own
// precedence in gram.y. `uescape` follows a `U&'...'` string.
const EXPRESSION_KEYWORDS: ReadonlySet<string> = new Set([
  "and",
  "at",
  "between",
  "collate",
  "escape",
  "ilike",
  "in",
  "is",
  "like",
  "operator",
  "similar",
  "uescape",
]);

const rule: RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Enforce a consistent stance on the `AS` keyword before column aliases (either always require it, or always forbid it)",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          style: { enum: ["always", "never"] },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferAs: "Use `AS` before the column alias `{{alias}}`.",
      unexpectedAs: "Omit `AS` before the column alias `{{alias}}`.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { style?: Style };
    const style: Style = option.style ?? DEFAULT_STYLE;

    // Strip surrounding double quotes from an identifier token's literal
    // text so we can compare it against `target.name` (which holds the
    // unquoted identifier).
    const tokenIdentifierText = (token: AST.Token): string => {
      const value = token.value;
      if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
        return value.slice(1, -1);
      }
      return value;
    };

    const tokens = context.sourceCode.ast.tokens ?? [];
    const isKeyword = (token: AST.Token, keyword: string) =>
      token.type === "Keyword" && token.value.toUpperCase() === keyword;
    const isPunctuatorIn = (token: AST.Token, values: ReadonlySet<string>) =>
      token.type === "Punctuator" && values.has(token.value);

    // Nesting depth of each token — inside parens, brackets or a CASE —
    // by token index. A closing token gets the depth outside it. Only
    // depths within one target are compared, so an `END` that closes
    // nothing (a column alias named `end`) just shifts what follows.
    // Built on first use, in one pass over the tokens.
    let depths: number[] | undefined;
    const depthAt = (index: number) => {
      if (!depths) {
        depths = [];
        let depth = 0;
        for (const token of tokens) {
          if (
            isPunctuatorIn(token, CLOSING_BRACKETS) ||
            isKeyword(token, "END")
          ) {
            depth--;
          }
          depths.push(depth);
          if (
            isPunctuatorIn(token, OPENING_BRACKETS) ||
            isKeyword(token, "CASE")
          ) {
            depth++;
          }
        }
      }
      return depths[index]!;
    };

    // Index of the first token starting at or after `offset`, by binary
    // search. Not `getTokenByRangeStart`: the tokenizer emits no token for
    // the `$` of a `$1` parameter.
    const firstTokenAtOrAfter = (offset: number) => {
      let low = 0;
      let high = tokens.length;
      while (low < high) {
        const mid = (low + high) >>> 1;
        if (tokens[mid]!.range[0] < offset) low = mid + 1;
        else high = mid;
      }
      return low;
    };

    // Whether the token at `index`, past the last range inside a value,
    // still belongs to the value. The parser anchors a dotted column
    // (`t.col`) or a function call (`count(*)`) on its first name, and no
    // range covers a closing `)`, `]` or CASE `END`.
    const continuesValue = (index: number, valueDepth: number) => {
      const token = tokens[index]!;
      const depth = depthAt(index);
      if (depth !== valueDepth) return depth > valueDepth;
      return (
        isPunctuatorIn(token, OPENING_BRACKETS) ||
        isPunctuatorIn(token, CLOSING_BRACKETS) ||
        isKeyword(token, "END") ||
        token.value === "." ||
        tokens[index - 1]!.value === "."
      );
    };

    // Only flag aliases that appear in SELECT's targetList or in a
    // RETURNING list. The same ResTarget node type is used for INSERT
    // column lists and UPDATE SET clauses where inserting `AS ` would be
    // a syntax error.
    const visit = (targetList: Ast.SelectStmt["targetList"]) => {
      if (!Array.isArray(targetList)) return;
      for (const target of targetList) {
        if (!isResTarget(target)) continue;
        if (!target.name) continue;
        const valRange = getFullSourceRange(target.val);
        if (!valRange) continue;
        let index = firstTokenAtOrAfter(target.range[0]);
        const valueDepth = depthAt(index);
        while (
          index < tokens.length &&
          (tokens[index]!.range[0] < valRange[1] ||
            continuesValue(index, valueDepth))
        ) {
          index++;
        }
        const next = tokens[index];
        if (!next) continue;
        const hasAs = isKeyword(next, "AS");

        if (style === "always" && !hasAs) {
          // Defense against values whose trailing tokens are neither
          // covered by a range nor stepped over above (`x IS NULL`,
          // `x COLLATE "C"`, `x::double precision`). Then the next token
          // is part of the expression — not the alias — so we must not
          // insert `AS` there. Confirm the next token is the alias
          // identifier before reporting.
          const aliasName = target.name;
          const looksLikeAliasIdentifier =
            tokenIdentifierText(next) === aliasName;
          if (!looksLikeAliasIdentifier) continue;
          context.report({
            loc: next.loc,
            messageId: "preferAs",
            data: { alias: aliasName },
            fix: (fixer) => fixer.insertTextBeforeRange(next.range, "AS "),
          });
          continue;
        }
        if (style === "never" && hasAs) {
          const after = tokens[index + 1];
          if (!after) continue;
          // Keep an `AS` that PostgreSQL needs: AS_LABEL keywords are a
          // column alias only after `AS` (`SELECT 1 month` does not parse),
          // and EXPRESSION_KEYWORDS can continue the value.
          const alias = after.value.toLowerCase();
          if (PG_AS_LABEL_KEYWORDS.has(alias) || EXPRESSION_KEYWORDS.has(alias))
            continue;
          context.report({
            loc: next.loc,
            messageId: "unexpectedAs",
            data: { alias: target.name },
            // Drop the `AS` keyword plus the whitespace separating
            // it from the alias identifier.
            fix: (fixer) => fixer.removeRange([next.range[0], after.range[0]]),
          });
        }
      }
    };

    return {
      SelectStmt: (node: Ast.SelectStmt) => visit(node.targetList),
      InsertStmt: (node: Ast.InsertStmt) => visit(node.returningList),
      UpdateStmt: (node: Ast.UpdateStmt) => visit(node.returningList),
      DeleteStmt: (node: Ast.DeleteStmt) => visit(node.returningList),
      MergeStmt: (node: { returningList?: Ast.SelectStmt["targetList"] }) =>
        visit(node.returningList),
    };
  },
};

export default rule;
