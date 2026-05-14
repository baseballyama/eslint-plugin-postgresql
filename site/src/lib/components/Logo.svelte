<script lang="ts">
  let { size = 22 }: { size?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" fill="currentColor" opacity="0.18" />
  <path
    d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linejoin="round"
  />
  <path
    d="M7 13.5c1.2-1 2.5-1 4 0s2.8 1 4 0M8 9.5h1M15 9.5h1"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
  />
</svg>
