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
