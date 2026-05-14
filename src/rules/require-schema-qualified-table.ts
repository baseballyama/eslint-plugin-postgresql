import type { Rule } from "eslint";
import type { Ast } from "postgresql-eslint-parser";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require `CREATE TABLE` to use a schema-qualified name (e.g. `audit.events`) so the target schema is explicit",
      category: "Best Practices",
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      requireSchemaQualifiedTable:
        "`CREATE TABLE` should specify a schema (e.g. `audit.events`). Without one, the target depends on `search_path` and may land in an unintended schema. The rule is off by default in `recommended` because many projects intentionally use the `public` schema.",
    },
  },
  create(context) {
    return {
      CreateStmt(node: Ast.CreateStmt) {
        const relation = node.relation as
          | (Ast.RangeVar & { schemaname?: string })
          | undefined;
        if (typeof relation?.schemaname === "string" && relation.schemaname)
          return;
        context.report({
          node: node as unknown as Rule.Node,
          messageId: "requireSchemaQualifiedTable",
        });
      },
    };
  },
};

export default rule;
