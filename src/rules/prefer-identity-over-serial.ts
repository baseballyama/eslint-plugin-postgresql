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

const SERIAL_TYPES = new Set(["smallserial", "serial", "bigserial"]);

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer `GENERATED ... AS IDENTITY` over `SERIAL` / `BIGSERIAL` / `SMALLSERIAL`",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      preferIdentity:
        "Use `GENERATED ALWAYS AS IDENTITY` (SQL standard) instead of `{{type}}`. The serial pseudo-types create a separately-owned sequence that breaks under pg_dump round-trips and does not honor column privileges.",
    },
  },
  create(context) {
    return {
      ColumnDef(node: any) {
        const t = getTypeName(node?.typeName);
        if (t && SERIAL_TYPES.has(t)) {
          context.report({
            node,
            messageId: "preferIdentity",
            data: { type: t },
          });
        }
      },
    };
  },
};

export default rule;
