import type { AST } from "eslint";
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

const isKeyword = (token: AST.Token, keyword: string) =>
  token.type === "Keyword" && token.value.toUpperCase() === keyword;

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
    return {
      JoinExpr(node: Ast.JoinExpr) {
        // `USING (col)` needs `col` exactly once on each side. Without the
        // schema, the rule can't tell whether two tables in a joined side
        // both have it.
        const joinedSide = isJoinExpr(node.larg) || isJoinExpr(node.rarg);
        if (joinedSide && !checkJoinedSides) return;
        const leftNames = new Set(getFromNames([node.larg]));
        const rightNames = new Set(getFromNames([node.rarg]));
        const { quals } = node;
        const conjuncts =
          isBoolExpr(quals) && quals.boolop === "AND_EXPR"
            ? quals.args!
            : [quals];
        const pairs: (readonly [Ast.ColumnRef, Ast.ColumnRef])[] = [];
        let hasOtherConditions = false;
        for (const conjunct of conjuncts) {
          const equality = getCrossSideEquality(
            conjunct,
            leftNames,
            rightNames,
          );
          if (!equality) {
            hasOtherConditions = true;
            continue;
          }
          const [a, b] = equality;
          // A join key between differently named columns has to stay in
          // `ON`, so `USING` can't take over the join.
          if (a.column !== b.column) return;
          pairs.push([a.ref, b.ref]);
        }
        if (!pairs.length) return;
        const columns = pairs
          .map(([ref]) => sourceCode.getText(getColumnTokens(ref)[1]))
          .join(", ");
        const onToken = sourceCode.getTokenBefore(
          sourceCode.getTokenByRangeStart(
            getFullSourceRange(conjuncts[0])![0],
          )!,
          { filter: (token) => isKeyword(token, "ON") },
        )!;
        if (hasOtherConditions) {
          // In `WHERE`, the other conditions keep the same rows only when
          // this join and every join around it are inner joins: an outer
          // join keeps the rows they reject.
          for (let join: unknown = node; isJoinExpr(join); join = join.parent) {
            if (join.jointype !== "JOIN_INNER") return;
          }
          context.report({
            loc: onToken.loc,
            messageId: "preferUsingAndWhere",
            data: { columns },
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
        context.report({
          loc: { start: onToken.loc.start, end: endToken.loc.end },
          messageId: "preferUsing",
          data: { columns },
          fix:
            joinedSide ||
            changesOutputColumns(node) ||
            sourceCode.commentsExistBetween(onToken, endToken)
              ? null
              : (fixer) =>
                  fixer.replaceTextRange(
                    [onToken.range[0], endToken.range[1]],
                    `USING (${columns})`,
                  ),
        });
      },
    };
  },
};

export default rule;
