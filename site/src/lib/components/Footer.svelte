<script lang="ts">
  import { base } from "$app/paths";
</script>

<footer class="foot">
  <div class="shell foot-grid">
    <div class="foot-col">
      <div class="foot-title">eslint-plugin-postgresql</div>
      <p class="foot-blurb">
        An ESLint plugin that lints <code>.sql</code> files with real PostgreSQL
        grammar and a curated set of best-practice rules.
      </p>
    </div>
    <div class="foot-col">
      <div class="foot-heading">Project</div>
      <ul>
        <li><a href={`${base}/`}>Home</a></li>
        <li><a href={`${base}/rules/`}>Rules</a></li>
        <li><a href={`${base}/playground/`}>Playground</a></li>
      </ul>
    </div>
    <div class="foot-col">
      <div class="foot-heading">Resources</div>
      <ul>
        <li>
          <a
            href="https://www.npmjs.com/package/eslint-plugin-postgresql"
            target="_blank"
            rel="noreferrer noopener">npm</a
          >
        </li>
        <li>
          <a
            href="https://github.com/baseballyama/eslint-plugin-postgresql"
            target="_blank"
            rel="noreferrer noopener">GitHub</a
          >
        </li>
        <li>
          <a
            href="https://github.com/baseballyama/postgresql-eslint-parser"
            target="_blank"
            rel="noreferrer noopener">postgresql-eslint-parser</a
          >
        </li>
      </ul>
    </div>
  </div>
  <div class="shell foot-foot">
    <span class="muted">© {new Date().getFullYear()} eslint-plugin-postgresql contributors</span>
    <span class="muted">Built on libpg-query · PostgreSQL 17</span>
  </div>
</footer>

<style>
  .foot {
    margin-top: 5rem;
    padding: 2.5rem 0 1.5rem;
    border-top: 1px solid var(--rule);
    background: var(--bg-soft);
  }
  .foot-grid {
    display: grid;
    grid-template-columns: 1.6fr 1fr 1fr;
    gap: 2rem;
    padding-bottom: 2rem;
  }
  .foot-col ul {
    list-style: none;
    padding: 0;
    margin: 0.6rem 0 0;
    display: grid;
    gap: 0.4rem;
  }
  .foot-col li {
    font-size: 0.9rem;
  }
  .foot-col a {
    color: var(--fg-muted);
    border-bottom-color: transparent;
  }
  .foot-col a:hover {
    color: var(--brand);
  }
  .foot-title {
    font-weight: 700;
    color: var(--fg-strong);
    margin-bottom: 0.4rem;
  }
  .foot-blurb {
    color: var(--fg-muted);
    font-size: 0.9rem;
    max-width: 36ch;
  }
  .foot-blurb code {
    background: var(--bg-code);
    padding: 0.05em 0.3em;
    border-radius: 3px;
    font-size: 0.88em;
    color: var(--brand);
  }
  .foot-heading {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--fg-strong);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .foot-foot {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 1.2rem;
    border-top: 1px solid var(--rule);
    font-size: 0.82rem;
  }
  .muted {
    color: var(--fg-faint);
  }
  @media (max-width: 720px) {
    .foot-grid {
      grid-template-columns: 1fr 1fr;
    }
    .foot-foot {
      flex-direction: column;
      gap: 0.2rem;
    }
  }
</style>
