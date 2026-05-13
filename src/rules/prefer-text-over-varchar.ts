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
      description:
        "Prefer `text` over `varchar(n)`; a length limit belongs in a CHECK constraint, not the type",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      preferText:
        "Use `text` instead of `varchar(n)`. PostgreSQL stores both the same way; the length cap is enforced by a constraint that you cannot relax without a full table rewrite. Move the limit into a CHECK constraint.",
    },
  },
  create(context) {
    return {
      ColumnDef(node: any) {
        const t = getTypeName(node?.typeName);
        if (t === "varchar" && Array.isArray(node.typeName?.typmods)) {
          context.report({ node, messageId: "preferText" });
        }
      },
    };
  },
};

export default rule;
