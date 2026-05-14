<script lang="ts">
  import { base } from "$app/paths";
  import { rules, categoryLabel } from "$lib/data/rules";
  import SqlBlock from "$lib/components/SqlBlock.svelte";
  import SeverityBadge from "$lib/components/SeverityBadge.svelte";
  import Playground from "$lib/components/Playground.svelte";
  import { highlightSql } from "$lib/util/sql-highlight";

  let { data } = $props();
  const rule = $derived(data.rule);

  const idx = $derived(rules.findIndex((r) => r.name === rule.name));
  const prev = $derived(idx > 0 ? rules[idx - 1] : null);
  const next = $derived(idx < rules.length - 1 ? rules[idx + 1] : null);

  // The snippet contains literal `import` syntax. We keep the package name
  // assembled at runtime so Vite's dependency scanner does not treat the
  // example code as a real module import from this file.
  const PKG = "eslint-plugin-" + "postgresql";
  const sev = $derived(rule.recommended === "off" ? '"warn"' : `"${rule.recommended}"`);

  function placeholderFor(type: string): string {
    if (type.includes("[]")) return "[]";
    if (type === "boolean") return "false";
    if (type === "number") return "0";
    return '""';
  }
  function optionLiteral(opt: { type: string; default?: unknown }): string {
    return opt.default === undefined ? placeholderFor(opt.type) : String(opt.default);
  }

  const ruleEntryLines = $derived.by(() => {
    const key = `"postgresql/${rule.name}"`;
    if (!rule.options || rule.options.length === 0) {
      return [`      ${key}: ${sev},`];
    }
    const opts = rule.options.map((o) => `          ${o.name}: ${optionLiteral(o)},`);
    return [
      `      ${key}: [`,
      `        ${sev},`,
      "        {",
      ...opts,
      "        },",
      "      ],",
    ];
  });

  const configSnippet = $derived(
    [
      "// eslint.config.js",
      `import postgresql from "${PKG}";`,
      "",
      "export default [",
      "  {",
      '    files: ["**/*.sql"],',
      "    languageOptions: {",
      "      parser: postgresql.configs.recommended.languageOptions.parser,",
      "    },",
      "    plugins: { postgresql },",
      "    rules: {",
      ...ruleEntryLines,
      "    },",
      "  },",
      "];",
    ].join("\n"),
  );
</script>

<svelte:head>
  <title>{rule.name} · eslint-plugin-postgresql</title>
  <meta name="description" content={rule.description} />
</svelte:head>

<article>
  <header class="rule-head">
    <div class="shell-wide">
      <a class="back" href={`${base}/rules/`}>
        <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
          <path
            d="M13 8H4M7 4L3 8l4 4"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        All rules
      </a>

      <p class="cat">{categoryLabel[rule.category]}</p>
      <h1 class="name mono">postgresql/<span class="bare">{rule.name}</span></h1>
      <p class="lede">{rule.description}</p>

      <ul class="meta">
        <li>
          <span class="meta-key">Type</span>
          <span class="pill pill-{rule.type}">{rule.type}</span>
        </li>
        <li>
          <span class="meta-key">Recommended</span>
          <SeverityBadge severity={rule.recommended} />
        </li>
        <li>
          <span class="meta-key">Fixable</span>
          <span class="pill pill-off">{rule.fixable ? "yes" : "no"}</span>
        </li>
      </ul>
    </div>
  </header>

  <section class="shell-wide content">
    <div class="grid">
      <div class="prose">
        <h2>Why this matters</h2>
        <p>{rule.longDescription}</p>

        <h2>Examples</h2>
        <div class="examples">
          <div class="example-col">
            <h3 class="ex-h"><span class="dot dot-bad"></span>Incorrect</h3>
            {#each rule.incorrect as snip}
              <SqlBlock sql={snip} tone="incorrect" />
            {/each}
          </div>

          <div class="example-col">
            <h3 class="ex-h"><span class="dot dot-good"></span>Correct</h3>
            {#each rule.correct as snip}
              <SqlBlock sql={snip} tone="correct" />
            {/each}
          </div>
        </div>

        <h2>Configure it</h2>
        <pre class="conf-code"><code>{@html highlightSql(configSnippet)}</code></pre>

        <h2>Options</h2>
        {#if rule.options && rule.options.length > 0}
          <dl class="options">
            {#each rule.options as opt}
              <dt>
                <code>{opt.name}</code>
                <span class="opt-type">{opt.type}</span>
                {#if opt.default !== undefined}
                  <span class="opt-default">default: <code>{String(opt.default)}</code></span>
                {/if}
              </dt>
              <dd>{opt.description}</dd>
            {/each}
          </dl>
        {:else}
          <p class="no-options">This rule has no options.</p>
        {/if}
      </div>

      <aside class="sidebar">
        <div class="side-card">
          <h3>At a glance</h3>
          <dl>
            <dt>Type</dt>
            <dd>{rule.type}</dd>
            <dt>Recommended</dt>
            <dd>{rule.recommended}</dd>
            <dt>Fixable</dt>
            <dd>{rule.fixable ? "yes" : "no"}</dd>
            <dt>Category</dt>
            <dd>{categoryLabel[rule.category]}</dd>
          </dl>
          <a
            class="src"
            href={`https://github.com/baseballyama/eslint-plugin-postgresql/blob/main/src/rules/${rule.name}.ts`}
          >
            View source on GitHub →
          </a>
        </div>
      </aside>
    </div>
  </section>

  <section class="shell-wide playground-section">
    <span class="eyebrow">Try this rule</span>
    <h2>Edit the SQL — only <code>{rule.name}</code> is enabled.</h2>
    <p class="muted">
      Pre-filled with the first incorrect example. Toggle off in the rule shelf to see how
      the diagnostic disappears.
    </p>
    <div class="pg-frame">
      <Playground
        variant="rule"
        onlyRule={rule.name}
        initialSql={rule.incorrect[0]}
        height="min(60vh, 480px)"
      />
    </div>
  </section>

  <nav class="prev-next shell-wide">
    {#if prev}
      <a class="prev-next-link" href={`${base}/rules/${prev.name}/`}>
        <span class="dir">← Previous</span>
        <span class="rn mono">{prev.name}</span>
      </a>
    {:else}
      <span></span>
    {/if}
    {#if next}
      <a class="prev-next-link right" href={`${base}/rules/${next.name}/`}>
        <span class="dir">Next →</span>
        <span class="rn mono">{next.name}</span>
      </a>
    {:else}
      <span></span>
    {/if}
  </nav>
</article>

<style>
  .rule-head {
    padding: 2.4rem 0 1.4rem;
    border-bottom: 1px solid var(--rule);
    background: var(--bg-soft);
  }
  .back {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: var(--fg-muted);
    font-size: 0.86rem;
    margin-bottom: 0.9rem;
    border-bottom-color: transparent;
  }
  .back:hover {
    color: var(--brand);
  }
  .cat {
    font-family: var(--font-mono);
    font-size: 0.74rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--fg-muted);
    margin-bottom: 0.55rem;
    font-weight: 700;
  }
  .name {
    font-size: clamp(1.4rem, 3vw, 2rem);
    font-weight: 700;
    color: var(--fg-muted);
    margin-bottom: 0.7rem;
    letter-spacing: -0.005em;
  }
  .bare {
    color: var(--brand);
  }
  .lede {
    font-size: 1.05rem;
    color: var(--fg);
    max-width: 60ch;
  }
  .meta {
    list-style: none;
    padding: 0;
    margin: 1.4rem 0 0;
    display: flex;
    gap: 1.8rem;
    flex-wrap: wrap;
  }
  .meta li {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .meta-key {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--fg-faint);
    font-weight: 700;
  }

  .eyebrow {
    display: inline-block;
    color: var(--brand);
    background: var(--brand-tint);
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    margin-bottom: 0.5rem;
  }

  .content {
    padding-top: 2.4rem;
  }
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 15rem;
    gap: 2.4rem;
    align-items: start;
  }
  @media (max-width: 980px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
  .prose {
    min-width: 0;
  }
  .prose h2 {
    margin-top: 1.8rem;
    margin-bottom: 0.7rem;
  }
  .prose h2:first-child {
    margin-top: 0;
  }
  .prose p {
    color: var(--fg-muted);
    max-width: 60ch;
    margin-bottom: 0.9rem;
    line-height: 1.65;
  }

  .examples {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 0.8rem;
  }
  @media (max-width: 760px) {
    .examples {
      grid-template-columns: 1fr;
    }
  }
  .example-col {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    min-width: 0;
  }
  .ex-h {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-mono);
    font-size: 0.74rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--fg-muted);
    font-weight: 700;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .dot-bad {
    background: var(--err);
  }
  .dot-good {
    background: var(--ok);
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: sticky;
    top: 80px;
  }
  @media (max-width: 980px) {
    .sidebar {
      position: static;
    }
  }
  .side-card {
    background: var(--bg-elevated);
    border: 1px solid var(--rule);
    border-radius: 8px;
    padding: 1rem 1.1rem;
  }
  .side-card h3 {
    font-size: 0.74rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--fg-muted);
    margin-bottom: 0.7rem;
    font-weight: 700;
  }
  .conf-code {
    margin: 0 0 1.2rem;
    padding: 1rem 1.1rem;
    background: var(--bg-code);
    border: 1px solid var(--rule);
    border-radius: 6px;
    font-size: 0.85rem;
    line-height: 1.55;
    overflow-x: auto;
    color: var(--fg);
  }
  .conf-code code {
    white-space: pre;
    background: transparent;
    padding: 0;
    border: 0;
  }
  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.35rem 0.8rem;
    margin: 0 0 0.9rem;
  }
  dt {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: var(--fg-faint);
  }
  dd {
    margin: 0;
    color: var(--fg);
    font-size: 0.86rem;
  }
  .src {
    font-size: 0.85rem;
  }

  .options {
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }
  .options dt {
    font-family: var(--font-base);
    font-size: 0.92rem;
    color: var(--fg);
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.55rem;
  }
  .options dt code {
    font-family: var(--font-mono);
    font-size: 0.88rem;
    background: var(--bg-soft);
    padding: 0.05rem 0.35rem;
    border-radius: 4px;
  }
  .opt-type {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: var(--fg-faint);
  }
  .opt-default {
    font-size: 0.78rem;
    color: var(--fg-faint);
  }
  .opt-default code {
    font-size: 0.78rem;
  }
  .options dd {
    color: var(--fg-soft, var(--fg));
    margin-bottom: 0.4rem;
    line-height: 1.5;
  }
  .no-options {
    color: var(--fg-muted);
    font-style: italic;
  }

  .playground-section {
    padding: 3rem 0 0;
  }
  .playground-section h2 {
    margin-top: 0.3rem;
    margin-bottom: 0.4rem;
  }
  .playground-section h2 code {
    font-family: var(--font-mono);
    background: var(--bg-code);
    padding: 0.05em 0.4em;
    border-radius: 3px;
    color: var(--brand);
    font-size: 0.85em;
  }
  .muted {
    color: var(--fg-muted);
  }
  .pg-frame {
    margin-top: 1.2rem;
  }

  .prev-next {
    display: flex;
    justify-content: space-between;
    gap: 0.8rem;
    margin: 2.6rem auto 1.6rem;
    border-top: 1px solid var(--rule);
    padding-top: 1.6rem;
  }
  .prev-next-link {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    border: 1px solid var(--rule);
    background: var(--bg);
    color: inherit;
    max-width: 18rem;
    border-bottom-color: var(--rule);
  }
  .prev-next-link:hover {
    border-color: var(--brand);
    background: var(--brand-tint);
    border-bottom-color: var(--brand);
  }
  .prev-next-link.right {
    text-align: right;
    margin-left: auto;
  }
  .dir {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--fg-muted);
    font-weight: 700;
  }
  .rn {
    color: var(--fg-strong);
    font-size: 0.88rem;
  }
</style>
