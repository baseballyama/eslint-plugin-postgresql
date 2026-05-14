<script lang="ts">
  import { onMount } from "svelte";
  import { rules as allRules, type Severity } from "$lib/data/rules";
  import { DEFAULT_EXAMPLE } from "$lib/data/examples";
  import { lint, type LintResult } from "$lib/linter/client";
  import type { Diagnostic, EnabledRules } from "$lib/linter/types";
  import Editor from "./Editor.svelte";

  /**
   * Playground is reused in three shapes:
   *  - "full": dedicated /playground page, all rules toggleable
   *  - "rule": embedded in a rule detail, only that rule plus no-syntax-error
   *  - "compact": no rule panel, for inline demos
   */
  let {
    initialSql = DEFAULT_EXAMPLE,
    onlyRule,
    variant = "full",
    height = "min(70vh, 640px)",
  }: {
    initialSql?: string;
    onlyRule?: string;
    variant?: "full" | "rule" | "compact";
    height?: string;
  } = $props();

  const DEFAULT_EXAMPLE_NAME = "Mixed example";
  const EXAMPLES: Array<{ name: string; sql: string }> = [
    { name: DEFAULT_EXAMPLE_NAME, sql: DEFAULT_EXAMPLE },
    {
      name: "Migration: create + index",
      sql: `CREATE TABLE "Users" (
  id BIGSERIAL,
  "Email" VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  payload JSON
);

CREATE INDEX idx_users_email ON "Users"("Email");

GRANT SELECT ON "Users" TO PUBLIC;
`,
    },
    {
      name: "Destructive operations",
      sql: `-- forgot a WHERE
DELETE FROM sessions;

UPDATE users SET active = false;

DROP TABLE legacy_table CASCADE;
TRUNCATE audit_log CASCADE;
`,
    },
    {
      name: "Subtle correctness traps",
      sql: `-- NOT IN against a subquery returns no rows when the subquery contains NULL
SELECT id
FROM users
WHERE id NOT IN (SELECT user_id FROM blocks);

-- implicit join, condition buried in WHERE
SELECT a.id FROM accounts a, transactions t WHERE a.id = t.account_id;
`,
    },
  ];

  // `initialSql` is a seed: parent components pass it once on mount.
  // svelte-ignore state_referenced_locally
  let sql = $state<string>(initialSql);
  let diagnostics = $state<Diagnostic[]>([]);
  let parseMs = $state(0);
  let ruleMs = $state(0);
  let fatal = $state<string | null>(null);
  let running = $state(false);
  let selectedExample = $state(DEFAULT_EXAMPLE_NAME);
  let ruleQuery = $state("");

  function defaultEnabled(): EnabledRules {
    const out: EnabledRules = {};
    if (onlyRule) {
      out["no-syntax-error"] = "error";
      const meta = allRules.find((r) => r.name === onlyRule);
      if (meta) {
        out[onlyRule] =
          meta.recommended === "off" ? "warn" : (meta.recommended as Exclude<Severity, "off">);
      }
      return out;
    }
    for (const r of allRules) {
      if (r.recommended !== "off") out[r.name] = r.recommended;
    }
    return out;
  }

  let enabled = $state<EnabledRules>(defaultEnabled());

  const displayedRules = $derived(
    onlyRule
      ? allRules.filter((r) => r.name === onlyRule || r.name === "no-syntax-error")
      : allRules.filter(
          (r) =>
            ruleQuery === "" ||
            r.name.toLowerCase().includes(ruleQuery.toLowerCase()) ||
            r.description.toLowerCase().includes(ruleQuery.toLowerCase()),
        ),
  );

  function toggle(name: string) {
    const meta = allRules.find((r) => r.name === name);
    const target =
      meta && meta.recommended !== "off"
        ? (meta.recommended as Exclude<Severity, "off">)
        : "warn";
    enabled = enabled[name] ? omit(enabled, name) : { ...enabled, [name]: target };
  }

  function setSeverity(name: string, sev: Exclude<Severity, "off">) {
    enabled = { ...enabled, [name]: sev };
  }

  function omit(obj: EnabledRules, key: string): EnabledRules {
    const { [key]: _, ...rest } = obj;
    void _;
    return rest;
  }

  let debounce: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    void sql;
    void enabled;
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(run, 220);
  });

  async function run() {
    running = true;
    fatal = null;
    const result: LintResult = await lint(sql, enabled);
    diagnostics = result.diagnostics;
    parseMs = result.parseMs;
    ruleMs = result.ruleMs;
    fatal = result.fatal ?? null;
    running = false;
  }

  onMount(run);

  function loadExample(name: string) {
    selectedExample = name;
    const e = EXAMPLES.find((x) => x.name === name);
    if (e) sql = e.sql;
  }

  function applyRecommended() {
    enabled = defaultEnabled();
  }

  function disableAll() {
    enabled = onlyRule ? { "no-syntax-error": "error" } : {};
  }

  const errorCount = $derived(diagnostics.filter((d) => d.severity === "error").length);
  const warnCount = $derived(diagnostics.filter((d) => d.severity === "warn").length);

  const markedLines = $derived(
    diagnostics.map((d) => ({ line: d.line, severity: d.severity })),
  );
</script>

<div class="pg" style="--pg-height: {height}" data-variant={variant}>
  {#if variant !== "compact"}
    <div class="toolbar">
      <label class="select">
        <span class="sr">Example</span>
        <select
          value={selectedExample}
          onchange={(e) => loadExample((e.currentTarget as HTMLSelectElement).value)}
        >
          {#each EXAMPLES as ex}
            <option value={ex.name}>{ex.name}</option>
          {/each}
        </select>
      </label>

      <div class="counts" aria-live="polite">
        <span class="count count-error" class:zero={errorCount === 0}>
          <span class="dot"></span>
          {errorCount} error{errorCount === 1 ? "" : "s"}
        </span>
        <span class="count count-warn" class:zero={warnCount === 0}>
          <span class="dot"></span>
          {warnCount} warning{warnCount === 1 ? "" : "s"}
        </span>
        <span class="timing mono muted">parse {parseMs.toFixed(0)}ms · rules {ruleMs.toFixed(0)}ms</span>
      </div>

      {#if !onlyRule}
        <div class="quick-actions">
          <button class="btn quiet" onclick={applyRecommended}>Recommended</button>
          <button class="btn quiet" onclick={disableAll}>Disable all</button>
        </div>
      {/if}
    </div>
  {/if}

  <div class="body">
    <div class="editor-wrap">
      <Editor bind:value={sql} onchange={(v) => (sql = v)} marked={markedLines} />
    </div>

    <div class="panel">
      <div class="panel-head">
        <span class="panel-title">Diagnostics</span>
        {#if running}
          <span class="mono muted small">…running</span>
        {/if}
      </div>

      {#if fatal}
        <div class="fatal">
          <strong>Parser unavailable.</strong>
          <p class="muted small">{fatal}</p>
        </div>
      {:else if diagnostics.length === 0}
        <div class="empty">
          <div class="empty-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12l4.5 4.5L19 7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <p>No issues found.</p>
          <p class="muted small">
            {#if Object.keys(enabled).length === 0}
              All rules are disabled. Toggle one on to start linting.
            {:else}
              {Object.keys(enabled).length} rule{Object.keys(enabled).length === 1 ? "" : "s"} enabled.
            {/if}
          </p>
        </div>
      {:else}
        <ul class="diags">
          {#each diagnostics as d, i (`${i}-${d.line}-${d.column}-${d.ruleId}`)}
            <li class="diag" data-severity={d.severity}>
              <div class="diag-head">
                <span class="loc mono">{d.line}:{d.column}</span>
                <span class="rule mono">postgresql/{d.ruleId}</span>
                <span class="pill {d.severity === 'error' ? 'pill-error' : 'pill-warn'}">{d.severity}</span>
              </div>
              <p class="diag-msg">{d.message}</p>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>

  {#if variant === "full" && !onlyRule}
    <details class="rules-shelf" open>
      <summary>
        <span>Rules</span>
        <span class="count-pill mono">{Object.keys(enabled).length} / {allRules.length}</span>
      </summary>

      <input class="search" type="search" placeholder="Filter rules…" bind:value={ruleQuery} />

      <ul class="rule-grid">
        {#each displayedRules as r}
          {@const on = !!enabled[r.name]}
          {@const sev = enabled[r.name]}
          <li class="rule-item" class:on>
            <label class="check">
              <input type="checkbox" checked={on} onchange={() => toggle(r.name)} />
              <span class="check-box"></span>
              <span class="rule-name mono">{r.name}</span>
            </label>
            {#if on && sev}
              <div class="sev-toggle">
                <button
                  class="seg"
                  class:active={sev === "warn"}
                  onclick={() => setSeverity(r.name, "warn")}
                  type="button">warn</button
                >
                <button
                  class="seg"
                  class:active={sev === "error"}
                  onclick={() => setSeverity(r.name, "error")}
                  type="button">error</button
                >
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    </details>
  {:else if onlyRule}
    <div class="single-rule-note">
      <span class="eyebrow">Rule under test</span>
      <code class="mono">{onlyRule}</code>
      <span class="muted small">— plus <code>no-syntax-error</code> as a safety net.</span>
    </div>
  {/if}
</div>

<style>
  .pg {
    background: var(--bg-elevated);
    border: 1px solid var(--rule);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.6rem 0.9rem;
    border-bottom: 1px solid var(--rule);
    background: var(--bg-soft);
  }
  .select select {
    background: var(--bg);
    border: 1px solid var(--rule-strong);
    border-radius: 4px;
    padding: 0.35rem 0.55rem;
    font-size: 0.86rem;
    color: var(--fg);
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .counts {
    display: inline-flex;
    align-items: center;
    gap: 0.85rem;
    flex-wrap: wrap;
  }
  .count {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-family: var(--font-mono);
    font-size: 0.82rem;
    color: var(--fg);
    font-weight: 600;
  }
  .count .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }
  .count-error .dot {
    background: var(--err);
  }
  .count-warn .dot {
    background: var(--warn);
  }
  .count.zero {
    opacity: 0.4;
    font-weight: 500;
  }
  .timing {
    font-size: 0.76rem;
  }
  .quick-actions {
    display: inline-flex;
    gap: 0.35rem;
  }
  .quick-actions :global(.btn) {
    padding: 0.4rem 0.7rem;
    font-size: 0.82rem;
  }

  .body {
    display: grid;
    grid-template-columns: 1.55fr 1fr;
    min-height: var(--pg-height);
  }
  @media (max-width: 880px) {
    .body {
      grid-template-columns: 1fr;
    }
  }

  .editor-wrap {
    border-right: 1px solid var(--rule);
    background: var(--bg-code);
    min-height: var(--pg-height);
  }
  @media (max-width: 880px) {
    .editor-wrap {
      border-right: 0;
      border-bottom: 1px solid var(--rule);
    }
  }

  .panel {
    display: flex;
    flex-direction: column;
    min-height: var(--pg-height);
    background: var(--bg-elevated);
  }
  .panel-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 0.7rem 0.95rem 0.4rem;
  }
  .panel-title {
    font-size: 0.74rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
    color: var(--fg-muted);
  }
  .small {
    font-size: 0.8rem;
  }
  .muted {
    color: var(--fg-muted);
  }

  .empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1.4rem;
    gap: 0.3rem;
  }
  .empty-mark {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: var(--ok-bg);
    color: var(--ok);
    margin-bottom: 0.4rem;
  }

  .fatal {
    padding: 1rem 1rem;
    background: var(--warn-bg);
    border-top: 1px solid var(--warn-border);
  }

  .diags {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    flex: 1;
  }
  .diag {
    padding: 0.7rem 0.95rem;
    border-bottom: 1px solid var(--rule);
    position: relative;
  }
  .diag::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
  }
  .diag[data-severity="error"]::before {
    background: var(--err);
  }
  .diag[data-severity="warn"]::before {
    background: var(--warn);
  }
  .diag-head {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin-bottom: 0.25rem;
    flex-wrap: wrap;
  }
  .loc {
    background: var(--bg-soft);
    border: 1px solid var(--rule);
    padding: 0.02rem 0.4rem;
    border-radius: 3px;
    font-size: 0.7rem;
    color: var(--fg-muted);
  }
  .rule {
    font-size: 0.78rem;
    color: var(--brand);
    font-weight: 600;
  }
  .diag-msg {
    color: var(--fg);
    font-size: 0.88rem;
    line-height: 1.5;
  }

  /* Rule shelf */
  .rules-shelf {
    border-top: 1px solid var(--rule);
    background: var(--bg);
  }
  summary {
    cursor: pointer;
    list-style: none;
    padding: 0.7rem 0.95rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 700;
    user-select: none;
    color: var(--fg-strong);
  }
  summary::-webkit-details-marker {
    display: none;
  }
  .count-pill {
    font-size: 0.76rem;
    padding: 0.12rem 0.5rem;
    background: var(--bg-soft);
    border: 1px solid var(--rule);
    border-radius: 999px;
    color: var(--fg-muted);
  }

  .search {
    margin: 0 0.95rem 0.55rem;
    width: calc(100% - 1.9rem);
    background: var(--bg-soft);
    border: 1px solid var(--rule-strong);
    border-radius: 4px;
    padding: 0.45rem 0.65rem;
    font-size: 0.88rem;
    color: var(--fg);
  }
  .search:focus {
    border-color: var(--brand);
    outline: 0;
  }

  .rule-grid {
    list-style: none;
    padding: 0 0.95rem 0.95rem;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 0.35rem;
  }
  .rule-item {
    border: 1px solid var(--rule);
    background: var(--bg);
    border-radius: 4px;
    padding: 0.45rem 0.6rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.45rem;
  }
  .rule-item.on {
    border-color: var(--brand);
    background: var(--brand-tint);
  }
  .check {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    flex: 1;
    min-width: 0;
  }
  .check input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .check-box {
    width: 14px;
    height: 14px;
    border: 1.5px solid var(--rule-strong);
    border-radius: 3px;
    flex: none;
    display: grid;
    place-items: center;
    background: var(--bg);
  }
  .rule-item.on .check-box {
    background: var(--brand);
    border-color: var(--brand);
  }
  .rule-item.on .check-box::after {
    content: "";
    width: 7px;
    height: 4px;
    border: solid #fff;
    border-width: 0 0 2px 2px;
    transform: rotate(-45deg) translate(1px, -1px);
  }
  .rule-name {
    font-size: 0.78rem;
    color: var(--fg-muted);
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  .rule-item.on .rule-name {
    color: var(--fg-strong);
  }

  .sev-toggle {
    display: inline-flex;
    border: 1px solid var(--rule-strong);
    border-radius: 4px;
    overflow: hidden;
  }
  .seg {
    background: transparent;
    border: 0;
    padding: 0.15rem 0.4rem;
    font-family: var(--font-mono);
    font-size: 0.68rem;
    color: var(--fg-muted);
    font-weight: 600;
  }
  .seg.active {
    background: var(--fg-strong);
    color: var(--bg);
  }

  .single-rule-note {
    border-top: 1px solid var(--rule);
    padding: 0.6rem 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.55rem;
    flex-wrap: wrap;
    background: var(--bg-soft);
  }
  .single-rule-note code {
    background: var(--bg);
    padding: 0.05em 0.4em;
    border-radius: 3px;
    color: var(--brand);
    font-size: 0.86rem;
  }
</style>
