import type { JSRuleDefinition, Rule } from "eslint";

/**
 * The rule shape every rule in this plugin uses.
 *
 * - `docs.category` is part of each rule's published meta, but ESLint's
 *   `RulesMetaDocs` no longer declares it, so it is added through the
 *   official `ExtRuleDocs` extension point.
 * - Visitors are keyed by postgresql-eslint-parser node types (`SelectStmt`,
 *   `ColumnDef`, …), which ESLint's ESTree-keyed `Rule.RuleListener` rejects.
 *   The visitor type mirrors `@eslint/core`'s `RuleVisitor`, which is what
 *   `ESLint.Plugin` accepts.
 */
type RuleVisitor = Record<string, (...args: any[]) => void>;

export type RuleModule = Omit<
  JSRuleDefinition<{ ExtRuleDocs: { category: string } }>,
  "create"
> & {
  create(context: Rule.RuleContext): RuleVisitor;
};
