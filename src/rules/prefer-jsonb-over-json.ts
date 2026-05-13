import type { Rule } from "eslint";

const getTypeName = (typeName: any): string | undefined => {
  if (!typeName || typeof typeName !== "object") return undefined;
  // typeName carries the qualified name across numeric-string keys "0", "1", ...
  // The unqualified type name is at the highest-numbered segment; lower
  // segments are schema qualifiers (`pg_catalog`, `public`, ...). Prefer the
  // segment-1 name when present so `public.varchar` still resolves to
  // `varchar` and not the schema.
  const v1 = typeName["1"]?.sval;
  if (typeof v1 === "string") return v1;
  const v0 = typeName["0"]?.sval;
  if (typeof v0 === "string") return v0;
  return undefined;
};

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer `jsonb` over `json` for column types",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      preferJsonb:
        "Use `jsonb` instead of `json`. `jsonb` stores the parsed representation, supports indexing, and is what almost every application actually wants.",
    },
  },
  create(context) {
    const check = (node: any) => {
      const t = getTypeName(node?.typeName);
      if (t === "json") {
        context.report({ node, messageId: "preferJsonb" });
      }
    };
    return { ColumnDef: check };
  },
};

export default rule;
