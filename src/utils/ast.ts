import type { Ast } from "postgresql-eslint-parser";

/**
 * Local extensions for AST nodes whose interface upstream is incomplete
 * (the parser exposes only `{ type }` for these but the actual node
 * carries more fields). Each entry should be removed once the upstream
 * parser package adds the field to its type definition.
 */
export type TruncateStmt = Ast.TruncateStmt & {
  behavior?: string;
  relations?: unknown[];
  restart_seqs?: boolean;
};

/**
 * Type predicates for the parser's AST union types. Using them in `if`
 * conditions narrows the type so callers don't need `as` casts at every
 * field access.
 */
export const isColumnRef = (node: unknown): node is Ast.ColumnRef =>
  isObjectWithType(node, "ColumnRef");

export const isAStar = (node: unknown): node is Ast.A_Star =>
  isObjectWithType(node, "A_Star");

export const isResTarget = (node: unknown): node is Ast.ResTarget =>
  isObjectWithType(node, "ResTarget");

export const isColumnDef = (node: unknown): node is Ast.ColumnDef =>
  isObjectWithType(node, "ColumnDef");

export const isConstraint = (node: unknown): node is Ast.Constraint =>
  isObjectWithType(node, "Constraint");

export const isSubLink = (node: unknown): node is Ast.SubLink =>
  isObjectWithType(node, "SubLink");

export const isRangeSubselect = (node: unknown): node is Ast.RangeSubselect =>
  isObjectWithType(node, "RangeSubselect");

export const isRangeFunction = (node: unknown): node is Ast.RangeFunction =>
  isObjectWithType(node, "RangeFunction");

const isRangeVar = (node: unknown): node is Ast.RangeVar =>
  isObjectWithType(node, "RangeVar");

export const isJoinExpr = (node: unknown): node is Ast.JoinExpr =>
  isObjectWithType(node, "JoinExpr");

export const isSelectStmt = (node: unknown): node is Ast.SelectStmt =>
  isObjectWithType(node, "SelectStmt");

export const isBoolExpr = (node: unknown): node is Ast.BoolExprPG =>
  isObjectWithType(node, "BoolExpr");

export const isAExpr = (node: unknown): node is Ast.A_Expr =>
  isObjectWithType(node, "A_Expr");

/**
 * Names a `table.column` reference can use to reach these `FROM` items, or
 * `undefined` for an item whose names aren't modelled here.
 */
export const getFromNames = (items: unknown[]): string[] | undefined => {
  const names: string[] = [];
  for (const item of items) {
    if (isRangeVar(item)) {
      names.push(item.alias?.aliasname ?? item.relname!);
    } else if (isRangeSubselect(item)) {
      // An unaliased sub-`SELECT` (PostgreSQL 16+) has no name to reach.
      if (item.alias) names.push(item.alias.aliasname);
    } else if (isRangeFunction(item)) {
      // An unaliased function is reachable by its own name, which is
      // not resolved here.
      if (!item.alias) return undefined;
      names.push(item.alias.aliasname);
    } else if (isJoinExpr(item)) {
      // An aliased join hides the names of the tables inside it.
      const joined = item.alias
        ? [item.alias.aliasname]
        : getFromNames([item.larg, item.rarg]);
      if (!joined) return undefined;
      names.push(...joined);
      // `JOIN ... USING (col) AS j` also names the joined columns `j.col`.
      if (item.join_using_alias) names.push(item.join_using_alias.aliasname);
    } else {
      return undefined;
    }
  }
  return names;
};

const isObjectWithType = <T extends string>(
  node: unknown,
  type: T,
): node is { type: T } => {
  if (typeof node !== "object" || node === null) return false;
  return (node as { type?: unknown }).type === type;
};

/**
 * Compute the full source range of an expression node by walking every
 * descendant and taking the union of their `range` values. Useful when
 * the node's own `range` is incomplete — e.g. `TypeCast.range` only
 * covers the `CAST` keyword or the `::` operator, not the surrounding
 * argument and type.
 *
 * Range values of `[0, 0]` (the parser's "no location" placeholder)
 * are skipped so they do not drag the start position to 0.
 */
export const getFullSourceRange = (node: unknown): [number, number] | null => {
  let min = Infinity;
  let max = -1;
  const seen = new WeakSet<object>();
  const visit = (n: unknown): void => {
    if (!n || typeof n !== "object") return;
    if (seen.has(n)) return;
    seen.add(n);
    const range = (n as { range?: unknown }).range;
    if (
      Array.isArray(range) &&
      typeof range[0] === "number" &&
      typeof range[1] === "number" &&
      range[0] !== 0
    ) {
      if (range[0] < min) min = range[0];
      if (range[1] > max) max = range[1];
    }
    if (Array.isArray(n)) {
      for (const item of n) visit(item);
    } else {
      for (const [key, value] of Object.entries(n as Record<string, unknown>)) {
        if (key === "parent" || key === "range" || key === "loc") continue;
        visit(value);
      }
    }
  };
  visit(node);
  if (max < 0 || min === Infinity) return null;
  return [min, max];
};

/**
 * Extract the unqualified PostgreSQL type name from a `ColumnDef.typeName`
 * value. The parser stores qualified names across numeric-string keys
 * ("0", "1", ...). The type name is at the highest-numbered segment;
 * lower segments are schema qualifiers (`pg_catalog`, `public`, ...).
 */
export const getTypeName = (typeName: unknown): string | undefined => {
  if (typeof typeName !== "object" || typeName === null) return undefined;
  const t = typeName as Record<string, unknown>;
  const v1 = (t["1"] as { sval?: unknown } | undefined)?.sval;
  if (typeof v1 === "string") return v1;
  const v0 = (t["0"] as { sval?: unknown } | undefined)?.sval;
  if (typeof v0 === "string") return v0;
  return undefined;
};
