import type { AST, Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import type { RuleModule } from "../utils/rule.js";
import {
  getFromNames,
  getFullSourceRange,
  isAExpr,
  isAStar,
  isBoolExpr,
  isColumnRef,
  isJoinExpr,
  isResTarget,
} from "../utils/ast.js";

/**
 * `table.column` (optionally `schema.table.column`): the column shapes
 * whose side of the join this rule can tell without knowing the schema.
 */
const asQualifiedColumn = (node: unknown) => {
  if (!isColumnRef(node)) return undefined;
  const [table, column] = node.fields.slice(-2);
  return table?.type === "String" && column?.type === "String"
    ? { ref: node, table: table.sval, column: column.sval }
    : undefined;
};

/**
 * The two columns of `left.col = right.col` (in either order), or
 * `undefined` for any other condition.
 */
const getCrossSideEquality = (
  conjunct: unknown,
  leftNames: Set<string>,
  rightNames: Set<string>,
) => {
  if (
    !isAExpr(conjunct) ||
    conjunct.kind !== "AEXPR_OP" ||
    conjunct.name?.[0]?.sval !== "="
  )
    return undefined;
  const a = asQualifiedColumn(conjunct.lexpr);
  const b = asQualifiedColumn(conjunct.rexpr);
  if (!a || !b) return undefined;
  return (leftNames.has(a.table) && rightNames.has(b.table)) ||
    (rightNames.has(a.table) && leftNames.has(b.table))
    ? ([a, b] as const)
    : undefined;
};

/**
 * `USING` merges each pair into one output column, listed first. A bare
 * `SELECT *` / `RETURNING *`, or the alias of an enclosing parenthesized
 * join, would expose that, so the rewrite would change the result.
 */
const changesOutputColumns = (join: Ast.JoinExpr) => {
  let outer = join;
  while (!outer.alias && isJoinExpr(outer.parent)) outer = outer.parent;
  if (outer.alias) return true;
  return ["targetList", "returningList"].some((key) => {
    const list: unknown = Reflect.get(outer.parent!, key);
    return (
      Array.isArray(list) &&
      list.some(
        (target) =>
          isResTarget(target) &&
          isColumnRef(target.val) &&
          isAStar(target.val.fields[0]),
      )
    );
  });
};

/**
 * The `AND`-ed conditions of a join, in source order. The parser only
 * flattens a left-nested `AND`, so `x AND (y AND z)` is flattened here.
 */
const getConjuncts = (expr: unknown): unknown[] =>
  isBoolExpr(expr) && expr.boolop === "AND_EXPR"
    ? expr.args!.flatMap(getConjuncts)
    : [expr];

const isKeyword = (token: AST.Token, keyword: string) =>
  token.type === "Keyword" && token.value.toUpperCase() === keyword;

/** `;` and the keywords that start a clause after a `FROM` list. */
const CLAUSE_STARTS = new Set([
  ";",
  "WHERE",
  "GROUP",
  "HAVING",
  "WINDOW",
  "ORDER",
  "LIMIT",
  "OFFSET",
  "FETCH",
  "FOR",
  "UNION",
  "INTERSECT",
  "EXCEPT",
  "RETURNING",
]);

/**
 * `,` and the keywords that can follow the condition of a join that no
 * outer join encloses.
 */
const JOIN_STARTS = new Set([
  ",",
  "JOIN",
  "INNER",
  "CROSS",
  "NATURAL",
  "ON",
  "USING",
]);

/** Whether `node` has a column that doesn't name its table. */
const hasUnqualifiedColumn = (node: unknown): boolean =>
  isColumnRef(node)
    ? node.fields.length === 1
    : typeof node === "object" &&
      node !== null &&
      Object.entries(node).some(
        ([key, value]) => key !== "parent" && hasUnqualifiedColumn(value),
      );

const rule: RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer `JOIN ... USING (col)` over `JOIN ... ON a.col = b.col`",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    hasSuggestions: true,
    schema: [
      {
        type: "object",
        properties: {
          checkJoinedSides: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferUsing:
        "Use `USING ({{columns}})` instead of `ON`. Every condition here matches a column to the same-named column on the other side, which `USING` names once.",
      preferUsingAndWhere:
        "Use `USING ({{columns}})` and move the other conditions to `WHERE`. In inner joins they keep the same rows there, and `USING` names each same-named column once.",
      suggestUsing: "Replace the `ON` condition with `USING ({{columns}})`.",
      suggestUsingAndWhere:
        "Replace the `ON` condition with `USING ({{columns}})` and move the other conditions to `WHERE`.",
    },
  },
  create(context) {
    const { checkJoinedSides = false } = (context.options[0] ?? {}) as {
      checkJoinedSides?: boolean;
    };
    const sourceCode = context.sourceCode;
    // A `table.column` reference's own range covers only its first name,
    // so read its first and last tokens (names and `.` alternate) instead.
    const getColumnTokens = (ref: Ast.ColumnRef) => {
      const first = sourceCode.getTokenByRangeStart(ref.range[0])!;
      return [
        first,
        sourceCode.getTokenAfter(first, { skip: ref.fields.length * 2 - 3 })!,
      ] as const;
    };
    // A node's full range starts at its first token, inside any `(`
    // around it.
    const getFirstToken = (node: unknown) =>
      sourceCode.getTokenByRangeStart(getFullSourceRange(node)![0])!;
    const getKeywordBefore = (node: unknown, keyword: string) =>
      sourceCode.getTokenBefore(getFirstToken(node), {
        filter: (token) => isKeyword(token, keyword),
      })!;
    // A keyword after `.` is a column name, as in `t.order`.
    const getWord = (token: AST.Token) =>
      sourceCode.getTokenBefore(token)?.value === "."
        ? ""
        : token.value.toUpperCase();
    const getNextValue = (token: AST.Token) =>
      sourceCode.getTokenAfter(token)?.value.toUpperCase() ?? "";
    // `WITH TIME ZONE` belongs to a type, `WITH ORDINALITY` to a function
    // in `FROM` and `WITH UNIQUE [KEYS]` to `IS JSON`, while `WITH CHECK OPTION` and `WITH [NO] DATA`
    // follow the query of a view or table. `ON CONFLICT` follows the query
    // of an `INSERT`.
    const isClauseStart = (token: AST.Token) => {
      const word = getWord(token);
      return (
        CLAUSE_STARTS.has(word) ||
        (word === "WITH" &&
          !["TIME", "ORDINALITY", "UNIQUE"].includes(getNextValue(token))) ||
        (word === "ON" && getNextValue(token) === "CONFLICT")
      );
    };
    const isJoinConditionEnd = (token: AST.Token) =>
      isClauseStart(token) || JOIN_STARTS.has(getWord(token));
    // The last token after `start` before one that `isEnd` accepts outside
    // the parentheses and brackets opened after `start`, or before a `)`
    // closing one opened before it.
    const getClauseEnd = (
      start: AST.Token,
      isEnd: (token: AST.Token) => boolean,
    ) => {
      let depth = 0;
      let end = start;
      for (
        let token = sourceCode.getTokenAfter(start);
        token;
        token = sourceCode.getTokenAfter(token)
      ) {
        if (token.value === "(" || token.value === "[") {
          depth++;
        } else if (token.value === ")" || token.value === "]") {
          if (!depth) break;
          depth--;
        } else if (!depth && isEnd(token)) {
          break;
        }
        end = token;
      }
      return end;
    };
    return {
      JoinExpr(node: Ast.JoinExpr) {
        // `USING (col)` needs `col` exactly once on each side. Without the
        // schema, the rule can't tell whether two tables in a joined side
        // both have it.
        const joinedSide = isJoinExpr(node.larg) || isJoinExpr(node.rarg);
        if (joinedSide && !checkJoinedSides) return;
        const leftNames = new Set(getFromNames([node.larg]));
        const rightNames = new Set(getFromNames([node.rarg]));
        const conjuncts = getConjuncts(node.quals);
        const pairs: (readonly [Ast.ColumnRef, Ast.ColumnRef])[] = [];
        // `USING` rejects a column listed twice, so a repeated pair names
        // its column once.
        const columnNames = new Set<string>();
        const columnTexts: string[] = [];
        const others = new Set<unknown>();
        for (const conjunct of conjuncts) {
          const equality = getCrossSideEquality(
            conjunct,
            leftNames,
            rightNames,
          );
          if (!equality) {
            others.add(conjunct);
            continue;
          }
          const [a, b] = equality;
          // A join key between differently named columns has to stay in
          // `ON`, so `USING` can't take over the join.
          if (a.column !== b.column) return;
          pairs.push([a.ref, b.ref]);
          if (!columnNames.has(a.column)) {
            columnNames.add(a.column);
            columnTexts.push(sourceCode.getText(getColumnTokens(a.ref)[1]));
          }
        }
        if (!pairs.length) return;
        const columns = columnTexts.join(", ");
        const onToken = getKeywordBefore(conjuncts[0], "ON");
        if (others.size) {
          // In `WHERE`, the other conditions keep the same rows only when
          // this join and every join around it are inner joins: an outer
          // join keeps the rows they reject.
          const joins: Ast.JoinExpr[] = [];
          for (let join: unknown = node; isJoinExpr(join); join = join.parent) {
            joins.push(join);
          }
          if (joins.some((join) => join.jointype !== "JOIN_INNER")) return;
          const statement = joins.at(-1)!.parent!;
          // `DELETE` lists its other tables in `USING`.
          const fromItems: unknown =
            Reflect.get(statement, "fromClause") ??
            Reflect.get(statement, "usingClause");
          const whereClause: { type: string } | undefined = Reflect.get(
            statement,
            "whereClause",
          );
          const endToken = getClauseEnd(onToken, isJoinConditionEnd);
          // The fix would delete a comment in the condition. `WHERE` can't
          // see the tables inside an aliased join, `MERGE` has no `WHERE`,
          // and `WHERE CURRENT OF` takes no other condition.
          if (
            sourceCode.commentsExistBetween(onToken, endToken) ||
            joins.some((join) => join.alias) ||
            !Array.isArray(fromItems) ||
            whereClause?.type === "CurrentOfExpr"
          ) {
            context.report({
              loc: onToken.loc,
              messageId: "preferUsingAndWhere",
              data: { columns },
            });
            return;
          }
          const separators = conjuncts.slice(1).map((conjunct) =>
            sourceCode.getTokenBefore(getFirstToken(conjunct), {
              filter: (token) => token.value !== "(",
            })!,
          );
          // Each condition runs from `ON` or its `AND` to the next `AND` or
          // the end, along with any `(` or `)` grouping it with others.
          const moved = conjuncts
            .flatMap((conjunct, i) => {
              if (!others.has(conjunct)) return [];
              const next = separators[i];
              const tokens = sourceCode.getTokensBetween(
                i ? separators[i - 1]! : onToken,
                next ?? endToken,
              );
              if (!next) tokens.push(endToken);
              const grouping =
                tokens.filter((token) => token.value === "(").length -
                tokens.filter((token) => token.value === ")").length;
              return sourceCode.text.slice(
                tokens[Math.max(grouping, 0)]!.range[0],
                tokens.at(Math.min(grouping, 0) - 1)!.range[1],
              );
            })
            .join(" AND ");
          const fix = (fixer: Rule.RuleFixer) => {
            const using = fixer.replaceTextRange(
              [onToken.range[0], endToken.range[1]],
              `USING (${columns})`,
            );
            if (!whereClause) {
              return [
                using,
                fixer.insertTextAfter(
                  getClauseEnd(
                    getKeywordBefore(fromItems[0], "FROM"),
                    isClauseStart,
                  ),
                  ` WHERE ${moved}`,
                ),
              ];
            }
            const whereToken = getKeywordBefore(whereClause, "WHERE");
            const whereStart = sourceCode.getTokenAfter(whereToken)!;
            // `AND` binds tighter than `OR`.
            return isBoolExpr(whereClause) && whereClause.boolop === "OR_EXPR"
              ? [
                  using,
                  fixer.insertTextBefore(whereStart, `${moved} AND (`),
                  fixer.insertTextAfter(
                    getClauseEnd(whereToken, isClauseStart),
                    ")",
                  ),
                ]
              : [using, fixer.insertTextBefore(whereStart, `${moved} AND `)];
          };
          // In `WHERE`, an unqualified column can also name a column of
          // another `FROM` item, or of the target of an `UPDATE` / `DELETE`.
          const needsReview =
            joinedSide ||
            changesOutputColumns(node) ||
            ((joins.length > 1 ||
              fromItems.length > 1 ||
              statement.type === "UpdateStmt" ||
              statement.type === "DeleteStmt") &&
              [...others].some(hasUnqualifiedColumn));
          context.report({
            loc: onToken.loc,
            messageId: "preferUsingAndWhere",
            data: { columns },
            fix: needsReview ? null : fix,
            suggest: needsReview
              ? [{ messageId: "suggestUsingAndWhere", data: { columns }, fix }]
              : [],
          });
          return;
        }
        const [, lastToken] = getColumnTokens(pairs.at(-1)![1]);
        // Only columns, `=`, `AND` and parentheses make up the condition,
        // so the parentheses still open after the last column close right
        // after it.
        const tokens = sourceCode.getTokensBetween(onToken, lastToken);
        const openParens =
          tokens.filter((token) => token.value === "(").length -
          tokens.filter((token) => token.value === ")").length;
        const endToken = openParens
          ? sourceCode.getTokenAfter(lastToken, { skip: openParens - 1 })!
          : lastToken;
        const fix = (fixer: Rule.RuleFixer) =>
          fixer.replaceTextRange(
            [onToken.range[0], endToken.range[1]],
            `USING (${columns})`,
          );
        // The rewrite would delete a comment in the condition, so it is
        // never offered then. On a joined side it fails if another table
        // there has the column too, and under `SELECT *` it changes the
        // output columns, so those only get a suggestion to review.
        const hasComments = sourceCode.commentsExistBetween(onToken, endToken);
        const needsReview = joinedSide || changesOutputColumns(node);
        context.report({
          loc: { start: onToken.loc.start, end: endToken.loc.end },
          messageId: "preferUsing",
          data: { columns },
          fix: hasComments || needsReview ? null : fix,
          suggest:
            hasComments || !needsReview
              ? []
              : [{ messageId: "suggestUsing", data: { columns }, fix }],
        });
      },
    };
  },
};

export default rule;
