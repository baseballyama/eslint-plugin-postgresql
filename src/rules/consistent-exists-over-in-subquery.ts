import type { AST, Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";
import type { RuleModule } from "../utils/rule.js";
import {
  isAExpr,
  isBoolExpr,
  isColumnRef,
  isJoinExpr,
  isRangeFunction,
  isRangeSubselect,
  isRangeVar,
  isResTarget,
  isSelectStmt,
} from "../utils/ast.js";

type Style = "always" | "never";

const DEFAULT_STYLE: Style = "always";

/**
 * Clauses whose condition only keeps or drops rows. A NULL there drops the
 * row just like FALSE, so `IN` (which can yield NULL) and `EXISTS` (which
 * cannot) keep the same rows.
 */
const ROW_FILTER_KEYS = ["whereClause", "quals", "havingClause"] as const;

/**
 * Sub-`SELECT` clauses that change which rows come back once the
 * correlated comparison moves out of its `WHERE`.
 */
const ROW_SHAPING_KEYS = [
  "distinctClause",
  "groupClause",
  "havingClause",
  "limitCount",
  "limitOffset",
  "lockingClause",
] as const;

/**
 * `true` when the `EXISTS` only decides whether a row is kept: it is a
 * `WHERE`, `ON` or `HAVING` condition with nothing but `AND` / `OR` above
 * it. Under `NOT`, or used as a value, `IN`'s NULL differs from FALSE.
 *
 * `BaseNode.parent` is declared upstream as `SQLStatementNode | Program`,
 * but the ESLint traversal assigns whatever node actually encloses the
 * child (`BoolExpr`, `JoinExpr`, ...), so the chain is read structurally.
 */
const isRowFilter = (node: Ast.SubLink): boolean => {
  let child: object = node;
  let parent: unknown = node.parent;
  while (isBoolExpr(parent) && parent.boolop !== "NOT_EXPR") {
    child = parent;
    parent = parent.parent;
  }
  const container = parent;
  return (
    typeof container === "object" &&
    container !== null &&
    ROW_FILTER_KEYS.some((key) => Reflect.get(container, key) === child)
  );
};

/**
 * Names a `table.column` reference can use to reach these `FROM` items, or
 * `undefined` when an item is one this rule does not model.
 */
const getFromNames = (items: unknown[]): string[] | undefined => {
  const names: string[] = [];
  for (const item of items) {
    if (isRangeVar(item)) {
      names.push(item.alias?.aliasname ?? item.relname!);
    } else if (isRangeSubselect(item) || isRangeFunction(item)) {
      if (item.alias) names.push(item.alias.aliasname);
    } else if (isJoinExpr(item)) {
      // An aliased join hides the names of the tables inside it.
      const joined = item.alias
        ? [item.alias.aliasname]
        : getFromNames([item.larg, item.rarg]);
      if (!joined) return undefined;
      names.push(...joined);
    } else {
      return undefined;
    }
  }
  return names;
};

/**
 * `table.column`: the one column shape whose scope this rule can tell
 * without knowing the schema.
 */
const asQualifiedColumn = (node: unknown) => {
  if (!isColumnRef(node) || node.fields.length !== 2) return undefined;
  const [table] = node.fields;
  return table?.type === "String"
    ? { ref: node, table: table.sval }
    : undefined;
};

/**
 * Splits `inner.col = outer.col` (in either order) into its sides, where
 * `inner` names a `FROM` item of the sub-`SELECT` and `outer` does not.
 */
const getCorrelation = (conjunct: unknown, innerNames: Set<string>) => {
  if (
    !isAExpr(conjunct) ||
    conjunct.kind !== "AEXPR_OP" ||
    conjunct.name?.length !== 1 ||
    conjunct.name[0]!.sval !== "="
  )
    return undefined;
  const left = asQualifiedColumn(conjunct.lexpr);
  const right = asQualifiedColumn(conjunct.rexpr);
  if (!left || !right) return undefined;
  const leftIsInner = innerNames.has(left.table);
  if (leftIsInner === innerNames.has(right.table)) return undefined;
  return leftIsInner
    ? { comparison: conjunct, inner: left.ref, outer: right.ref }
    : { comparison: conjunct, inner: right.ref, outer: left.ref };
};

const isKeyword = (
  token: AST.Token | null,
  keyword: string,
): token is AST.Token =>
  token?.type === "Keyword" && token.value.toUpperCase() === keyword;

const rule: RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce a consistent stance on `EXISTS (subquery)` vs `column IN (subquery)`",
      category: "Best Practices",
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
      preferExists:
        "Use `EXISTS (...)` instead of `IN (subquery)`. `IN` returns NULL when the subquery has any NULL row, which silently turns the row into a no-match; `EXISTS` is unambiguously boolean.",
      preferIn:
        "Use `{{column}} IN (subquery)` instead of `EXISTS (...)`. As a row filter both keep the same rows, and `IN` needs no correlated comparison.",
    },
  },
  create(context) {
    const option = (context.options[0] ?? {}) as { style?: Style };
    const style: Style = option.style ?? DEFAULT_STYLE;
    const sourceCode = context.sourceCode;
    // A `table.column` reference's own range covers only `table`, so read
    // its first and last tokens instead.
    const getColumnTokens = (ref: Ast.ColumnRef) => {
      const first = sourceCode.getTokenByRangeStart(ref.range[0])!;
      return [first, sourceCode.getTokenAfter(first, { skip: 1 })!] as const;
    };
    const getColumnText = (ref: Ast.ColumnRef) => {
      const [first, last] = getColumnTokens(ref);
      return sourceCode.text.slice(first.range[0], last.range[1]);
    };
    return {
      SubLink(node: Ast.SubLink) {
        if (style === "always") {
          // ANY_SUBLINK covers both `x IN (subquery)` and the
          // semantically-equivalent `x = ANY (subquery)` form.
          if (node.subLinkType !== "ANY_SUBLINK") return;
          context.report({
            node: node as unknown as Rule.Node,
            messageId: "preferExists",
          });
          return;
        }
        if (node.subLinkType !== "EXISTS_SUBLINK" || !isRowFilter(node)) return;
        const select = node.subselect;
        if (!isSelectStmt(select) || !select.fromClause?.length) return;
        if (ROW_SHAPING_KEYS.some((key) => select[key] !== undefined)) return;
        // Aggregates and set-returning functions in the select list change
        // whether a row comes back at all, so only allow constants and
        // columns (`SELECT 1`, `SELECT *`, `SELECT col`).
        if (
          !select.targetList?.every(
            (target) =>
              isResTarget(target) &&
              (target.val?.type === "A_Const" || isColumnRef(target.val)),
          )
        )
          return;
        const innerNames = getFromNames(select.fromClause);
        if (!innerNames) return;
        const where = select.whereClause;
        const conjuncts =
          isBoolExpr(where) && where.boolop === "AND_EXPR"
            ? (where.args ?? [])
            : [where];
        const innerNameSet = new Set(innerNames);
        const correlations = conjuncts.flatMap(
          (conjunct) => getCorrelation(conjunct, innerNameSet) ?? [],
        );
        if (correlations.length !== 1) return;
        const { comparison, inner, outer } = correlations[0]!;
        const outerText = getColumnText(outer);
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "preferIn",
          data: { column: outerText },
          fix(fixer) {
            const existsToken = sourceCode.getTokenByRangeStart(node.range[0])!;
            const selectToken = sourceCode.getTokenAfter(existsToken, {
              skip: 1,
            });
            if (!isKeyword(selectToken, "SELECT")) return null;
            // The select list holds only constants and columns, so the
            // first `FROM` keyword after `SELECT` starts the `FROM` clause.
            const fromToken = sourceCode.getTokenAfter(selectToken, {
              filter: (token) => isKeyword(token, "FROM"),
            })!;
            const [startRef, endRef] =
              inner.range[0] < outer.range[0] ? [inner, outer] : [outer, inner];
            const [startToken] = getColumnTokens(startRef);
            const [, endToken] = getColumnTokens(endRef);
            // Remove the comparison together with its `AND` (or with
            // `WHERE` when it is the only condition). Anything else around
            // it, such as parentheses, is left for a human to rewrite.
            const before = sourceCode.getTokenBefore(startToken);
            const after = sourceCode.getTokenAfter(endToken);
            let removal: AST.Range;
            if (
              isKeyword(before, "AND") ||
              (where === comparison && isKeyword(before, "WHERE"))
            ) {
              removal = [
                sourceCode.getTokenBefore(before)!.range[1],
                endToken.range[1],
              ];
            } else if (isKeyword(after, "AND")) {
              removal = [
                startToken.range[0],
                sourceCode.getTokenAfter(after)!.range[0],
              ];
            } else {
              return null;
            }
            return [
              fixer.replaceText(existsToken, `${outerText} IN`),
              fixer.replaceTextRange(
                [
                  sourceCode.getTokenAfter(selectToken)!.range[0],
                  sourceCode.getTokenBefore(fromToken)!.range[1],
                ],
                getColumnText(inner),
              ),
              fixer.removeRange(removal),
            ];
          },
        });
      },
    };
  },
};

export default rule;
