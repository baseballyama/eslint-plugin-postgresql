<script lang="ts">
  import { highlightSql } from "$lib/util/sql-highlight";

  let {
    sql,
    label,
    tone = "neutral",
  }: {
    sql: string;
    label?: string;
    tone?: "neutral" | "incorrect" | "correct";
  } = $props();
</script>

<figure class="block" data-tone={tone}>
  {#if label || tone !== "neutral"}
    <figcaption>
      {#if tone === "incorrect"}
        <span class="dot dot-bad" aria-hidden="true"></span>
        <span class="cap">Incorrect</span>
      {:else if tone === "correct"}
        <span class="dot dot-good" aria-hidden="true"></span>
        <span class="cap">Correct</span>
      {/if}
      {#if label}<span class="label">{label}</span>{/if}
    </figcaption>
  {/if}
  <pre><code>{@html highlightSql(sql)}</code></pre>
</figure>

<style>
  .block {
    margin: 0;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--rule);
    background: var(--bg-code);
  }
  figcaption {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.9rem;
    border-bottom: 1px solid var(--rule);
    background: var(--bg-soft);
    font-size: 0.74rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--fg-muted);
    font-weight: 700;
  }
  .cap {
    font-weight: 700;
  }
  .label {
    color: var(--fg-faint);
    text-transform: none;
    letter-spacing: 0.02em;
    margin-left: auto;
    font-family: var(--font-mono);
    font-weight: 500;
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
  .block[data-tone="incorrect"] {
    border-color: var(--err-border);
  }
  .block[data-tone="correct"] {
    border-color: color-mix(in oklab, var(--ok) 35%, var(--rule));
  }
  pre {
    margin: 0;
    padding: 0.9rem 1rem;
    background: transparent;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    line-height: 1.55;
    overflow-x: auto;
  }
  pre code {
    background: transparent;
    padding: 0;
    border: 0;
  }
</style>
