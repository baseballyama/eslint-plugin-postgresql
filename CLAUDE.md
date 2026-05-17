# CLAUDE.md

`eslint-plugin-postgresql` is an ESLint plugin that lints PostgreSQL SQL files.
It ships rules that detect syntax errors and enforce PostgreSQL-specific best
practices, using [`postgresql-eslint-parser`](https://github.com/baseballyama/postgresql-eslint-parser)
(which itself wraps [`libpg-query`](https://github.com/pganalyze/libpg-query-node))
to parse `.sql` files into an ESLint-compatible AST.

## Project overview

- **Audience**: OSS — code that external contributors and end users will read.
- **Language / stack**: TypeScript, ESM-only, published to npm as
  `eslint-plugin-postgresql`. Built with rolldown, tested with vitest, type-
  checked with `tsc`, linted with oxlint, formatted with Prettier.
- **Package manager**: pnpm. Lockfile is committed. Use `pnpm install
--frozen-lockfile` in CI.
- **Public API**: the default export from `dist/index.js` — a `plugin` object
  exposing `rules` and `configs.recommended`. Anything not reachable through
  that export is internal.
- **Related projects**:
  - [`postgresql-eslint-parser`](https://github.com/baseballyama/postgresql-eslint-parser) — parser layer.
  - [`libpg-query`](https://github.com/pganalyze/libpg-query-node) — actual PostgreSQL parser.
    Bugs in those layers should go upstream, not here.

OSS is not the same as "code only I touch." Optimize for **a stranger not
getting confused**, not for your own convenience.

## Repository layout

| Path                     | Purpose                                                     |
| ------------------------ | ----------------------------------------------------------- |
| `src/index.ts`           | Plugin entry point (`rules`, `configs.recommended`).        |
| `src/rules/*.ts`         | One file per rule. Export an ESLint rule object as default. |
| `src/meta.ts`            | Package name / version pulled into the plugin meta.         |
| `tests/*.test.ts`        | Vitest unit tests, one per rule plus an `index` smoke test. |
| `tests/fixtures/<rule>/` | SQL fixtures + sibling `<basename>.yaml` snapshots.         |
| `tests/test-utils.ts`    | Shared test helpers (linter wiring, YAML fixture loader).   |
| `scripts/create-rule.js` | Scaffold a new rule + tests + fixture directory.            |
| `dist/`                  | Build output (gitignored except for publish).               |
| `.changeset/`            | Pending changesets — drive the release PR.                  |

## Daily commands

```bash
pnpm install                # install dependencies
pnpm test                   # run vitest
pnpm test:watch             # vitest in watch mode
pnpm check:all              # format + types + lint + build + publint + knip
pnpm test:all               # check:all + tests
pnpm format:fix             # prettier --write .
pnpm lint:fix               # oxlint --fix
pnpm create-rule            # scaffold a new rule
pnpm update-fixtures        # regenerate fixture snapshots when intentional
```

`check:all` is the local pre-commit gate; CI runs the same script.

## Core principles

Every line of code must be justified.

| Principle               | Meaning                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------- |
| Simplicity              | No premature abstraction, no features for hypothetical futures. YAGNI.                  |
| Consistency             | Match existing patterns. New patterns require an explicit reason.                       |
| Performance             | Don't write N+1 / O(n²) in the first place. Defend with code shape, not profilers.      |
| Security                | Validate at boundaries (rule input, file I/O). Watch OWASP.                             |
| Maintainability         | Write code that you in 6 months and a new contributor can read and understand.          |
| Backwards compatibility | Public API is preserved unless a breaking change is genuinely justified. Follow SemVer. |

## "One way to do one thing"

> A capability has exactly one canonical path through the public API.

For a lint plugin, this translates concretely:

- **One rule per concern.** Don't add `no-foo` and `prefer-not-foo` when one
  rule with an option covers it.
- **`configs.recommended` is the canonical preset for correctness.** Don't
  add `configs.strict` / `configs.loose` to expose different severity sets
  for the same rules — users can flip severities per rule themselves.
- **`configs.stylistic` is the second preset, for layout / casing / formatting
  rules only.** It exists because PostgreSQL formatters (`prettier-plugin-sql`,
  `pg_format`) do not cover PL/pgSQL well, and because correctness and style
  are genuinely orthogonal axes that users opt into independently. Stylistic
  rules MUST be `fixable`. Do not split it further (no `stylistic-strict` etc).
- **`configs.all` is the third preset.** Every rule the plugin ships,
  enabled at `error`. Maintained mechanically: when you add a rule, also
  add it to `all`. The `index.test.ts` smoke test enforces that `all`
  references every rule in `plugin.rules`. Off-by-default in practice
  (it's noisy); intended for users who want to see everything and pick.
- **Options are a last resort.** Each option is a forever-supported branch. If
  you can't name a real user with a real need, don't add the option.

Decision flow when evaluating a feature request:

1. Is the lint check **already reachable** through an existing rule (possibly
   with a different option value)? → Yes: reject.
2. Is the rule's domain **inside this project's scope** (PostgreSQL SQL
   linting)? → No: redirect (parser bugs go upstream; generic SQL style rules
   live in their own plugin).
3. If it **replaces** an existing rule, is the replacement strictly better on
   every dimension (precision, perf, fixability)? → If only some, you're
   proposing a parallel API → reject.

## Defensive programming

**Yes at boundaries; no internally.**

| Situation                          | Defend? | Example                                                                 |
| ---------------------------------- | ------- | ----------------------------------------------------------------------- |
| User SQL fed into the parser       | **Yes** | Parser may throw; surface as `no-syntax-error`, don't crash the linter. |
| User rule options                  | **Yes** | Validate option shape via the rule's `schema`.                          |
| ESLint AST node types we visit     | No      | Trust the parser's types; don't re-check `node.type`.                   |
| Cases ruled out by the type system | No      | No "just in case" guards on `unknown`-narrowed values.                  |

"Just in case" checks pile up and **bury the real validation** under noise.

**Don't swallow exceptions.** Catching a parser error and silently producing no
diagnostics hides the bug. Either let it propagate (real bug) or convert it to
a lint diagnostic with a clear message (expected failure mode).

## Hard "no"s

- **N+1 access**: visiting the same subtree repeatedly inside a visitor. Walk once.
- **O(n²) operations**: `find` / `filter` / linear search inside a visitor over
  the same array. Build a Map / Set first.
- **Type-cast escape hatches**: `as unknown as T` and equivalents. Use the
  parser's typed AST.
- **Redundant "just-in-case" checks**: re-validating values whose contract is
  already met.
- **Magic numbers / strings**: name them as constants. Especially message IDs.
- **Dead code**: "might use this later," commented-out rule logic. Delete.
- **Swallowed exceptions**: `catch` blocks that silently return. Let errors
  propagate (or surface as a diagnostic).
- **Silent breaking changes to public API**: changing a rule's default
  severity in `recommended`, renaming a rule, renaming an option, or changing
  what an existing rule reports counts as breaking. Always add a changeset.

## Authoring a rule

Each rule lives in `src/rules/<rule-name>.ts` and exports a default `Rule.RuleModule`:

```ts
import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem", // "problem" | "suggestion" | "layout"
    docs: {
      description: "One-line description; ends up in the README rule table.",
    },
    schema: [], // JSON schema for options; [] means no options
    messages: {
      // Stable IDs. Renaming a messageId is a breaking change.
      missingLimit: "SELECT statement is missing a LIMIT clause.",
    },
  },
  create(context) {
    return {
      SelectStmt(node) {
        // ...
        context.report({ node, messageId: "missingLimit" });
      },
    };
  },
};

export default rule;
```

Then wire it into `src/index.ts`:

- Add to `rules`.
- Decide whether it goes into `configs.recommended` and at what severity.
  - `error`: the rule has effectively no false positives and the violation is
    a real bug (e.g., `no-syntax-error`).
  - `warn`: the rule encodes a best practice but may have legitimate
    exceptions (e.g., `require-limit`).
  - **Off by default**: don't add it to `recommended` at all.

`pnpm create-rule` scaffolds the file, the test file, and the fixture
directory. Use it to keep the structure consistent.

### Rule docs

Each rule's documentation lives in the README's "Rules" section. New rules
must be added there in the same PR, with at least one `❌ Incorrect` and one
`✅ Correct` SQL example, plus the rule's type, recommended severity, and
fixability.

### Tests

The repo's pattern is **fixture-driven**: each rule has a single test file
that wires the fixture loader.

1. **`tests/<rule>.test.ts`** — one-line file that calls
   `runRuleTest("<rule>", rule, "<description>")`; the helper auto-loads
   every `.sql` file under `tests/fixtures/<rule>/{valid,invalid}/`.
2. **`tests/fixtures/<rule>/valid/*.sql`** — SQL the rule must accept. An
   optional sibling `<basename>.yaml` may declare `options:` when the rule
   needs non-default options.
3. **`tests/fixtures/<rule>/invalid/*.sql`** — SQL the rule must flag, paired
   with `<basename>.yaml` containing:
   - `options:` — optional rule options array.
   - `errors:` — list of expected reports. Each entry pins `messageId`,
     `message`, `line`, `column`, and (when available) `endLine` / `endColumn`.
   - `output:` — required. Either the autofixed SQL string, or `null` to
     assert no fix is produced (also required for non-fixable rules).

You don't write the `errors` / `output` payload by hand. Add the `.sql`
fixture (and any `options`) and run `pnpm update-fixtures`; the test
harness lints the fixture, materialises the YAML, and `pnpm format:fix`
tidies it. Inspect the diff and commit it.

A bug fix must include a new invalid fixture that fails on the parent commit.

## Public API is a contract

Anything reachable through `import postgresql from "eslint-plugin-postgresql"`
is part of the contract. That includes:

- Every rule name (`postgresql/<rule>`) and what it reports.
- Every `messageId` (users may match on these in suppressions).
- The shape of `configs.recommended`.
- Default severity of each rule in `configs.recommended`.

Changes to any of those are breaking and need a major bump after 1.0 (and a
clear changeset before 1.0). Adding a new rule (off by default in
`recommended`) is additive — minor bump.

## CHANGELOG is for users, not for you

Write from the user's perspective.

- ❌ _refactor:_ extract helper for visitor walk — users don't care.
- ✅ _feat:_ add `no-select-star` rule — users want to know.
- ✅ _fix:_ `require-limit` no longer flags `SELECT ... FOR UPDATE` — symptom-based.

A pure-internal refactor PR doesn't need a changeset; if it does need one,
mark it `chore`.

Releases are driven by `@changesets/cli`. Add a `.changeset/*.md` file in the
same PR as any user-visible change. `pnpm update:version` consumes them; CI
publishes on merge of the release PR.

## Issues and PRs are a conversation, not a queue

- When asked a question, **point at existing docs / existing rules** before
  writing code.
- Evaluate feature requests against the "one way to do one thing" rule (is it
  already reachable?).
- For bug reports, **write a failing fixture first**. Don't fix what you can't
  reproduce.

See `.claude/skills/issue-triage/SKILL.md` for the full workflow.

## The AI-slop era

**LLM-authored issues, PRs, and review comments are now common.** They tend to
be formally well-structured but substantively thin: not reproducible, already
addressed, out of scope, or copy-pasted from documentation.

This repository takes a hard line:

- **Templates are mandatory.** Issues and PRs that don't follow the templates
  are auto-closed by `.github/workflows/template-compliance.yml`.
- **Repeated low-effort AI submissions can lead to a ban.** This is stated in
  the templates so contributors (and the LLMs they use) know upfront.
- **Using AI is fine. Posting AI output without reading it is not.** Whatever
  a model produces, **a human is responsible** for whether it's worth a
  maintainer's time.

When Claude or any other LLM works in this repository, it must **re-read its
own output and ask: is this thin, generic, or templated?** before posting
anything visible to the public.

## Skills

The `.claude/skills/` directory contains workflow-specific guides. Use them
when the situation matches.

| Skill                | When to use                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `pr-workflow`        | Creating a PR                                                          |
| `full-code-review`   | Reviewing a branch from a maintainer's perspective before opening a PR |
| `review-response`    | Responding to GitHub review comments                                   |
| `run-check-and-test` | Running quality checks and tests before commit / PR                    |
| `issue-triage`       | Classifying a GitHub issue and routing it to the right workflow        |

When you add a new skill, append it to this table.

## Operations bundled with the repo

- **`SECURITY.md`** — private vulnerability reporting via GitHub Security
  Advisories.
- **`.github/CODEOWNERS`** — review routing. Single maintainer today.
- **`renovate.json`** — Renovate config. Grouped dependency bumps,
  weekly lock-file maintenance, and security alert labelling.
- **`.github/workflows/template-compliance.yml`** — auto-close issues and PRs
  that don't follow the templates.
