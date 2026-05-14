<script lang="ts">
  import { page } from "$app/stores";
  import { base } from "$app/paths";
  import Logo from "./Logo.svelte";
  import { createThemeStore, type Theme } from "$lib/theme.svelte";

  const items = [
    { href: "/", label: "Home" },
    { href: "/rules", label: "Rules" },
    { href: "/playground", label: "Playground" },
  ];

  const isActive = (href: string) => {
    const pathname = $page.url.pathname;
    const target = `${base}${href}`;
    if (href === "/") return pathname === `${base}/` || pathname === base;
    return pathname.startsWith(target);
  };

  const theme = createThemeStore();
  const label: Record<Theme, string> = {
    auto: "System",
    light: "Light",
    dark: "Dark",
  };
</script>

<header class="nav">
  <div class="shell row">
    <a class="brand" href={`${base}/`}>
      <span class="mark" aria-hidden="true"><Logo size={22} /></span>
      <span class="name">eslint-plugin-postgresql</span>
    </a>

    <nav class="links" aria-label="Primary">
      {#each items as item (item.href)}
        <a
          class="link"
          class:active={isActive(item.href)}
          href={`${base}${item.href === "/" ? "/" : item.href}`}
        >
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="utils">
      <button
        class="icon-btn"
        type="button"
        aria-label="Switch theme (currently {label[theme.value]})"
        title="Theme: {label[theme.value]} — click to cycle"
        onclick={() => theme.cycle()}
      >
        {#if theme.value === "dark"}
          <!-- moon -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
          </svg>
        {:else if theme.value === "light"}
          <!-- sun -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.6" />
            <path
              d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        {:else}
          <!-- auto / system -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.6" />
            <path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
        {/if}
      </button>

      <a
        class="icon-btn"
        href="https://github.com/baseballyama/eslint-plugin-postgresql"
        target="_blank"
        rel="noreferrer noopener"
        aria-label="GitHub"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            d="M12 .5C5.65.5.5 5.66.5 12.02c0 5.09 3.29 9.4 7.86 10.93.58.11.79-.25.79-.55v-1.95c-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.35.95.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.71 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.97 10.97 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.44-2.69 5.42-5.25 5.7.41.36.78 1.07.78 2.15v3.18c0 .31.21.67.8.55C20.22 21.4 23.5 17.1 23.5 12 23.5 5.66 18.34.5 12 .5Z"
          />
        </svg>
      </a>
    </div>
  </div>
</header>

<style>
  .nav {
    position: sticky;
    top: 0;
    z-index: 50;
    background: var(--bg);
    border-bottom: 1px solid var(--rule);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    height: 60px;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    color: var(--fg-strong);
    font-weight: 700;
    border: none;
    font-size: 0.98rem;
  }
  .brand:hover {
    color: var(--brand);
    border-bottom-color: transparent;
  }
  .mark {
    color: var(--brand);
    display: inline-grid;
    place-items: center;
  }
  .name {
    letter-spacing: -0.005em;
  }
  .links {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-left: auto;
  }
  .link {
    display: inline-block;
    padding: 0.5rem 0.85rem;
    color: var(--fg-muted);
    border: none;
    border-radius: 4px;
    font-size: 0.92rem;
    font-weight: 700;
    transition:
      color 0.12s ease,
      background 0.12s ease;
  }
  .link:hover {
    color: var(--fg-strong);
    background: var(--bg-soft);
    border-bottom: none;
  }
  .link.active {
    color: var(--brand);
    background: var(--brand-tint);
  }
  .utils {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding-left: 0.5rem;
    border-left: 1px solid var(--rule);
  }
  .icon-btn {
    display: inline-grid;
    place-items: center;
    color: var(--fg-muted);
    width: 36px;
    height: 36px;
    border-radius: 4px;
    border: none;
    background: transparent;
  }
  .icon-btn:hover {
    color: var(--fg-strong);
    background: var(--bg-soft);
    border-bottom: none;
  }

  @media (max-width: 640px) {
    .name {
      display: none;
    }
    .links {
      gap: 0;
    }
    .link {
      padding: 0.5rem 0.55rem;
      font-size: 0.85rem;
    }
  }
</style>
