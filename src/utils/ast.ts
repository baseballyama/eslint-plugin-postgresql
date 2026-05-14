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
