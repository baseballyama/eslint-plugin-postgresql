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
        "Prefer `timestamptz` (`TIMESTAMP WITH TIME ZONE`) over `timestamp` (without time zone)",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      preferTimestamptz:
        "Use `timestamptz` (or `TIMESTAMP WITH TIME ZONE`) instead of `timestamp`. `timestamp` is timezone-naive: it stores the wall-clock value you handed in and assumes every reader and writer share the same convention, so two clients on different `TimeZone` settings will disagree on which instant the row represents.",
    },
  },
  create(context) {
    return {
      ColumnDef(node: any) {
        const t = getTypeName(node?.typeName);
        if (t === "timestamp") {
          context.report({ node, messageId: "preferTimestamptz" });
        }
      },
    };
  },
};

export default rule;
