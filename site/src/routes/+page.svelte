<script lang="ts">
  import { base } from "$app/paths";
  import { rules, categoryLabel } from "$lib/data/rules";
  import { highlightSql } from "$lib/util/sql-highlight";

  const ruleCount = rules.length;
  const errorCount = rules.filter((r) => r.recommended === "error").length;
  const warnCount = rules.filter((r) => r.recommended === "warn").length;

  const features: { title: string; body: string }[] = [
    {
      title: "Real PostgreSQL grammar",
      body: "Built on libpg-query — the Postgres server parser compiled to WebAssembly via postgresql-eslint-parser. CTEs, partial indexes, JSON path expressions all parse the same way they would in your database.",
    },
    {
      title: "22 curated rules",
      body: "Each rule has one concern. require-where-in-delete, no-not-in-subquery, prefer-timestamptz, prefer-text-over-varchar — pitfalls every Postgres reviewer eventually flags, encoded as lint diagnostics.",
    },
    {
      title: "One-line flat config",
      body: "Spread configs.recommended into your eslint.config.js. The preset binds the parser, plugin, severities and file glob — no separate languageOptions wiring required.",
    },
    {
      title: "Browser playground",
      body: "Open /playground in any browser. Parser and rules run entirely in a Web Worker through libpg-query.wasm — your SQL never leaves the tab.",
    },
    {
      title: "Stable messageIds",
      body: "Every diagnostic has a stable messageId you can match in suppressions and severity overrides. Renames count as breaking changes.",
    },
    {
      title: "Errors don't bring down the lint run",
      body: "Syntax errors surface as a single no-syntax-error diagnostic instead of crashing the linter, so the rest of your SQL files still get analysed.",
    },
  ];

  // Assemble the snippet at runtime — Vite's dependency scanner otherwise
  // mistakes the literal `import "eslint-plugin-postgresql"` inside this
  // string for a real source-file import.
  const PKG = "eslint-plugin-" + "postgresql";
  const configSnippet = [
    "// eslint.config.js",
    `import postgresql from "${PKG}";`,
    "",
    "export default [",
    "  {",
    '    files: ["**/*.sql"],',
    "    ...postgresql.configs.recommended,",
    "  },",
    "];",
  ].join("\n");
</script>

<section class="hero">
  <div class="shell hero-inner">
    <span class="eyebrow">ESLint plugin · PostgreSQL 17</span>
    <h1>Lint your SQL the same way you lint everything else.</h1>
    <p class="lede">
      <strong>eslint-plugin-postgresql</strong> ships {ruleCount} rules that catch real
      PostgreSQL pitfalls — syntax errors, timezone-naive timestamps, <code>NOT IN</code>
      against subqueries, missing <code>WHERE</code> on <code>DELETE</code>. Backed by
      <a href="https://github.com/baseballyama/postgresql-eslint-parser">postgresql-eslint-parser</a>
      so the AST is the same one Postgres itself uses.
    </p>

    <div class="cta-row">
      <a class="btn primary" href={`${base}/playground/`}>Open the Playground</a>
      <a class="btn ghost" href={`${base}/rules/`}>Browse rules</a>
    </div>

    <div class="install">
      <span class="install-label">Install</span>
      <code>npm install --save-dev eslint-plugin-postgresql</code>
    </div>
  </div>
</section>

<section class="stats">
  <div class="shell stat-grid">
    <div class="stat">
      <div class="stat-num">{ruleCount}</div>
      <div class="stat-label">rules</div>
    </div>
    <div class="stat">
      <div class="stat-num">{errorCount}</div>
      <div class="stat-label">recommended as error</div>
    </div>
    <div class="stat">
      <div class="stat-num">{warnCount}</div>
      <div class="stat-label">recommended as warn</div>
    </div>
    <div class="stat">
      <div class="stat-num">WASM</div>
      <div class="stat-label">browser playground</div>
    </div>
  </div>
</section>

<section class="features">
  <div class="shell">
    <h2 class="section-title">Features</h2>
    <ul class="feature-grid">
      {#each features as f (f.title)}
        <li class="feature">
          <h3>{f.title}</h3>
          <p>{f.body}</p>
        </li>
      {/each}
    </ul>
  </div>
</section>

<section class="usage">
  <div class="shell usage-grid">
    <div>
      <h2 class="section-title">Drop it into your ESLint config</h2>
      <p class="usage-lede">
        Spread <code>postgresql.configs.recommended</code> into a flat-config entry and point
        ESLint at your <code>.sql</code> files. Your editor and CI will lint SQL the same way
        they lint TypeScript.
      </p>
      <p class="usage-lede">
        See the <a href={`${base}/rules/`}>rules</a> for what fires by default, or try the
        <a href={`${base}/playground/`}>playground</a> to feel the diagnostics in your hands.
      </p>
    </div>
    <pre class="code"><code>{@html highlightSql(configSnippet)}</code></pre>
  </div>
</section>

<section class="coverage">
  <div class="shell">
    <h2 class="section-title">What it covers</h2>
    <p class="coverage-lede">
      Every rule has a single concern. Together they map onto the categories that come up
      most often in PostgreSQL code review.
    </p>
    <ul class="cat-grid">
      {#each ["safety", "schema", "perf", "security", "style", "syntax"] as cat (cat)}
        {@const list = rules.filter((r) => r.category === cat)}
        <li class="cat">
          <h3>{categoryLabel[cat as keyof typeof categoryLabel]}</h3>
          <ul class="cat-rules">
            {#each list as r (r.name)}
              <li>
                <a class="rule-chip" href={`${base}/rules/${r.name}/`}>
                  <code>{r.name}</code>
                </a>
              </li>
            {/each}
          </ul>
        </li>
      {/each}
    </ul>
  </div>
</section>

<style>
  .hero {
    padding: 4rem 0 3rem;
  }
  .hero-inner {
    max-width: 46rem;
  }
  .eyebrow {
    margin-bottom: 1rem;
  }
  h1 {
    font-size: clamp(2rem, 4.5vw, 3rem);
    line-height: 1.1;
  }
  .lede {
    margin-top: 1.1rem;
    font-size: 1.1rem;
    color: var(--fg-muted);
    line-height: 1.6;
    max-width: 40rem;
  }
  .lede strong {
    color: var(--fg-strong);
    font-weight: 700;
  }
  .lede code {
    background: var(--bg-code);
    padding: 0.1em 0.35em;
    border-radius: 3px;
    font-size: 0.9em;
    color: var(--brand);
    font-family: var(--font-mono);
  }

  .cta-row {
    display: flex;
    gap: 0.6rem;
    margin-top: 1.6rem;
    flex-wrap: wrap;
  }

  .install {
    margin-top: 2rem;
    display: flex;
    gap: 0.7rem;
    align-items: center;
    border: 1px solid var(--rule);
    border-radius: 6px;
    padding: 0.55rem 0.85rem;
    background: var(--bg-code);
    width: fit-content;
    max-width: 100%;
    overflow: auto;
  }
  .install-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--fg-faint);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .install code {
    font-size: 0.92rem;
    color: var(--fg-strong);
    font-family: var(--font-mono);
  }

  /* Stats */
  .stats {
    padding: 2rem 0;
    border-top: 1px solid var(--rule);
    background: var(--bg-soft);
  }
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
  }
  @media (max-width: 720px) {
    .stat-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .stat-num {
    font-size: clamp(1.8rem, 3.5vw, 2.4rem);
    font-weight: 900;
    color: var(--brand);
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .stat-label {
    margin-top: 0.4rem;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--fg-muted);
    font-weight: 700;
  }

  /* Features */
  .features {
    padding: 3rem 0 2rem;
    border-top: 1px solid var(--rule);
  }
  .section-title {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
  }
  .feature-grid {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
    gap: 1.5rem;
  }
  .feature {
    border: 1px solid var(--rule);
    border-radius: 8px;
    padding: 1.3rem 1.35rem;
    background: var(--bg);
    transition:
      border-color 0.15s ease;
  }
  .feature:hover {
    border-color: var(--brand);
  }
  .feature h3 {
    margin-bottom: 0.5rem;
    color: var(--fg-strong);
  }
  .feature p {
    color: var(--fg-muted);
    font-size: 0.93rem;
    line-height: 1.55;
  }
  .feature p :global(code) {
    background: var(--bg-code);
    padding: 0.05em 0.3em;
    border-radius: 3px;
    font-size: 0.88em;
    color: var(--brand);
    font-family: var(--font-mono);
  }

  /* Usage */
  .usage {
    padding: 3rem 0 2rem;
    border-top: 1px solid var(--rule);
  }
  .usage-grid {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 2.5rem;
    align-items: start;
  }
  .usage-lede {
    margin-top: 1rem;
    color: var(--fg-muted);
    max-width: 36rem;
  }
  .usage-lede code {
    background: var(--bg-code);
    padding: 0.05em 0.3em;
    border-radius: 3px;
    font-size: 0.9em;
    color: var(--brand);
    font-family: var(--font-mono);
  }
  .code {
    margin: 0;
    padding: 1rem 1.1rem;
    background: var(--bg-code);
    border: 1px solid var(--rule);
    border-radius: 8px;
    overflow: auto;
    font-size: 0.85rem;
    line-height: 1.55;
    color: var(--fg);
  }
  .code code {
    white-space: pre;
  }
  @media (max-width: 760px) {
    .usage-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Coverage */
  .coverage {
    padding: 3rem 0 4rem;
    border-top: 1px solid var(--rule);
  }
  .coverage-lede {
    max-width: 48rem;
    color: var(--fg-muted);
    margin-bottom: 2rem;
  }
  .cat-grid {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
    gap: 1rem;
  }
  .cat {
    border: 1px solid var(--rule);
    border-radius: 8px;
    background: var(--bg);
    padding: 1rem 1.1rem;
  }
  .cat h3 {
    margin-bottom: 0.7rem;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--fg-muted);
    font-weight: 700;
  }
  .cat-rules {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }
  .rule-chip {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.55rem;
    background: var(--bg-soft);
    border: 1px solid var(--rule);
    border-radius: 999px;
    color: var(--fg-muted);
    font-size: 0.78rem;
  }
  .rule-chip code {
    font-family: var(--font-mono);
    color: inherit;
    background: transparent;
    padding: 0;
  }
  .rule-chip:hover {
    color: var(--brand);
    border-color: var(--brand);
    background: var(--brand-tint);
  }
</style>
