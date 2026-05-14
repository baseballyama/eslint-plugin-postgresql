<script lang="ts">
  import type { Severity } from "$lib/data/rules";
  let { severity, label }: { severity: Severity; label?: string } = $props();
</script>

{#if severity === "error"}
  <span class="pill pill-error">{label ?? "error"}</span>
{:else if severity === "warn"}
  <span class="pill pill-warn">{label ?? "warn"}</span>
{:else}
  <span class="pill pill-off">{label ?? "off"}</span>
{/if}
