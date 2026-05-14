<script lang="ts">
  import { base } from "$app/paths";
  import { rules, categoryLabel, type RuleMeta, type Severity, type RuleType } from "$lib/data/rules";
  import SeverityBadge from "$lib/components/SeverityBadge.svelte";

  let query = $state("");
  let severityFilter = $state<"all" | Severity>("all");
  let typeFilter = $state<"all" | RuleType>("all");
  let categoryFilter = $state<"all" | RuleMeta["category"]>("all");

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return rules.filter((r) => {
      if (severityFilter !== "all" && r.recommended !== severityFilter) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (q === "") return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.longDescription.toLowerCase().includes(q)
      );
    });
  });

  function clearFilters() {
    query = "";
    severityFilter = "all";
    typeFilter = "all";
    categoryFilter = "all";
  }
</script>

<svelte:head>
  <title>Rules · eslint-plugin-postgresql</title>
</svelte:head>

<section class="head">
  <div class="shell">
    <span class="eyebrow">Rules</span>
    <h1>{rules.length} rules, each with a single concern.</h1>
    <p class="lede">
      Filter by severity, kind, or category. Click any rule for the full rationale, examples
      and a per-rule playground seeded with the failing SQL.
    </p>
  </div>
</section>

<section class="shell filter-bar">
  <div class="filters">
    <label class="search">
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5" />
        <path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <input
        type="search"
        placeholder="Search rule name or description…"
        bind:value={query}
      />
    </label>

    <div class="group">
      <span class="label">Recommended</span>
      <div class="seg-group">
        {#each ["all", "error", "warn", "off"] as s (s)}
          <button
            class="seg"
            class:active={severityFilter === s}
            onclick={() => (severityFilter = s as typeof severityFilter)}
            type="button"
          >
            {s}
          </button>
        {/each}
      </div>
    </div>

    <div class="group">
      <span class="label">Type</span>
      <div class="seg-group">
        {#each ["all", "problem", "suggestion"] as t (t)}
          <button
            class="seg"
            class:active={typeFilter === t}
            onclick={() => (typeFilter = t as typeof typeFilter)}
            type="button"
          >
            {t}
          </button>
        {/each}
      </div>
    </div>

    <div class="group wide">
      <span class="label">Category</span>
      <div class="seg-group wrap">
        <button
          class="seg"
          class:active={categoryFilter === "all"}
          onclick={() => (categoryFilter = "all")}
          type="button">all</button
        >
        {#each Object.keys(categoryLabel) as c (c)}
          <button
            class="seg"
            class:active={categoryFilter === c}
            onclick={() => (categoryFilter = c as RuleMeta["category"])}
            type="button"
          >
            {categoryLabel[c as RuleMeta["category"]].toLowerCase()}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <div class="filter-meta">
    <span class="muted small">
      Showing <strong>{filtered.length}</strong> of {rules.length}
    </span>
    {#if filtered.length < rules.length}
      <button class="btn-link" onclick={clearFilters}>clear filters</button>
    {/if}
  </div>
</section>

<section class="shell rules-section">
  {#if filtered.length === 0}
    <div class="empty">
      <p>No rules match those filters.</p>
      <button class="btn ghost" onclick={clearFilters}>Clear filters</button>
    </div>
  {:else}
    <ul class="rule-list">
      {#each filtered as r (r.name)}
        <li class="rule-card">
          <a class="rule-link" href={`${base}/rules/${r.name}/`}>
            <div class="rule-head">
              <h3 class="mono name">{r.name}</h3>
              <div class="badges">
                <SeverityBadge severity={r.recommended} />
                <span class="pill pill-{r.type}">{r.type}</span>
              </div>
            </div>
            <p class="desc">{r.description}</p>
            <div class="rule-foot">
              <span class="cat-tag">{categoryLabel[r.category]}</span>
              <span class="arrow">
                Read
                <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
                  <path
                    d="M3 8h9M9 4l4 4-4 4"
                    stroke="currentColor"
                    stroke-width="2"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </div>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
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
  }

  .filter-bar {
    padding-top: 0.6rem;
  }
  .filters {
    background: var(--bg-elevated);
    border: 1px solid var(--rule);
    border-radius: 8px;
    padding: 1rem 1.1rem;
    display: grid;
    grid-template-columns: 1.6fr 1fr 1fr 1.4fr;
    gap: 1.2rem;
    align-items: end;
  }
  @media (max-width: 980px) {
    .filters {
      grid-template-columns: 1fr 1fr;
    }
    .search {
      grid-column: 1 / -1;
    }
    .group.wide {
      grid-column: 1 / -1;
    }
  }

  .search {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 0.7rem;
    border: 1px solid var(--rule-strong);
    background: var(--bg);
    border-radius: 4px;
    color: var(--fg-muted);
  }
  .search:focus-within {
    border-color: var(--brand);
    color: var(--brand);
  }
  .search input {
    border: 0;
    background: transparent;
    outline: 0;
    color: var(--fg);
    width: 100%;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--fg-faint);
    font-weight: 700;
  }
  .seg-group {
    display: inline-flex;
    border: 1px solid var(--rule-strong);
    border-radius: 4px;
    overflow: hidden;
    background: var(--bg);
  }
  .seg-group.wrap {
    flex-wrap: wrap;
  }
  .seg {
    background: transparent;
    border: 0;
    padding: 0.4rem 0.65rem;
    font-family: var(--font-mono);
    font-size: 0.76rem;
    color: var(--fg-muted);
    cursor: pointer;
    transition:
      background 0.12s ease,
      color 0.12s ease;
  }
  .seg:hover {
    background: var(--bg-soft);
    color: var(--fg-strong);
  }
  .seg.active {
    background: var(--fg-strong);
    color: var(--bg);
  }

  .filter-meta {
    margin: 0.9rem 0 1.3rem;
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }
  .muted {
    color: var(--fg-muted);
  }
  .small {
    font-size: 0.86rem;
  }
  .btn-link {
    background: transparent;
    border: 0;
    color: var(--brand);
    font-size: 0.86rem;
    padding: 0;
    border-bottom: 1px solid currentColor;
    cursor: pointer;
  }

  .rules-section {
    padding-bottom: 3rem;
  }

  .rule-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
    gap: 1rem;
  }

  .rule-link {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 1.1rem 1.15rem 1rem;
    background: var(--bg);
    border: 1px solid var(--rule);
    border-radius: 8px;
    color: inherit;
    text-decoration: none;
    height: 100%;
    transition:
      border-color 0.15s ease,
      background 0.15s ease;
  }
  .rule-link:hover {
    border-color: var(--brand);
    border-bottom-color: var(--brand);
  }

  .rule-head {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 0.7rem;
  }
  .name {
    font-size: 0.95rem;
    color: var(--fg-strong);
    font-weight: 700;
  }
  .badges {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
  }
  .desc {
    color: var(--fg-muted);
    font-size: 0.93rem;
    line-height: 1.5;
    flex: 1;
  }
  .rule-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 0.55rem;
    border-top: 1px solid var(--rule);
  }
  .cat-tag {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--fg-faint);
    font-weight: 700;
  }
  .arrow {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.82rem;
    color: var(--brand);
    font-weight: 700;
  }

  .empty {
    padding: 2.5rem 1rem;
    text-align: center;
    border: 1px solid var(--rule);
    border-radius: 8px;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: var(--fg-muted);
  }
</style>
