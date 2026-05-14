<script lang="ts">
  import Playground from "$lib/components/Playground.svelte";
</script>

<svelte:head>
  <title>Playground · eslint-plugin-postgresql</title>
</svelte:head>

<section class="head">
  <div class="shell">
    <span class="eyebrow">Playground</span>
    <h1>Lint PostgreSQL in your browser.</h1>
    <p class="lede">
      The same parser the published plugin uses — <code>libpg-query</code> — compiled to
      WebAssembly and running entirely on this page. Nothing is sent to a server. Pick a
      preset, edit the SQL, toggle rules.
    </p>
  </div>
</section>

<section class="pg-wrap">
  <div class="shell-wide">
    <Playground height="min(75vh, 720px)" />
  </div>
</section>

<section class="helper shell">
  <h2>Reading the diagnostics</h2>
  <ul class="legend">
    <li>
      <span class="dot dot-error"></span>
      <strong>error</strong>
      <span class="muted">— rules whose violation is almost certainly a bug.</span>
    </li>
    <li>
      <span class="dot dot-warn"></span>
      <strong>warn</strong>
      <span class="muted">— best-practice rules with legitimate exceptions.</span>
    </li>
    <li>
      <span class="dot dot-off"></span>
      <strong>off</strong>
      <span class="muted">— off by default; opt in when it suits your project.</span>
    </li>
  </ul>

  <p class="note">
    <strong>Heads up:</strong> the playground runs a faithful reimplementation of the
    production rules against libpg-query's AST. The README in the repository is the
    authoritative description of behaviour; if you spot a discrepancy, please
    <a href="https://github.com/baseballyama/eslint-plugin-postgresql/issues">open an issue</a>.
  </p>
</section>

<style>
  .head {
    padding: 3rem 0 1.4rem;
  }
  .eyebrow {
    display: inline-block;
    color: var(--brand);
    background: var(--brand-tint);
    padding: 0.3rem 0.7rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    margin-bottom: 1rem;
  }
  h1 {
    font-size: clamp(2rem, 4vw, 2.6rem);
    line-height: 1.1;
  }
  .lede {
    margin-top: 1rem;
    color: var(--fg-muted);
    max-width: 48rem;
    font-size: 1rem;
  }
  .lede code {
    font-family: var(--font-mono);
    background: var(--bg-code);
    padding: 0.05em 0.35em;
    border-radius: 3px;
    color: var(--brand);
    font-size: 0.9em;
  }

  .pg-wrap {
    padding: 1.4rem 0 0;
  }

  .helper {
    padding: 3rem 0 0;
  }
  .helper h2 {
    margin-bottom: 1rem;
  }
  .legend {
    list-style: none;
    padding: 0;
    margin: 0 0 1.6rem;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.8rem;
  }
  @media (max-width: 760px) {
    .legend {
      grid-template-columns: 1fr;
    }
  }
  .legend li {
    border: 1px solid var(--rule);
    border-radius: 6px;
    background: var(--bg-elevated);
    padding: 0.7rem 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.92rem;
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex: none;
  }
  .dot-error {
    background: var(--err);
  }
  .dot-warn {
    background: var(--warn);
  }
  .dot-off {
    background: var(--fg-faint);
  }
  .muted {
    color: var(--fg-muted);
  }
  .note {
    background: var(--brand-tint);
    border: 1px solid var(--brand-soft);
    border-left: 3px solid var(--brand);
    padding: 0.8rem 1rem;
    border-radius: 4px;
    color: var(--fg);
    font-size: 0.92rem;
    max-width: 64rem;
  }
</style>
