<script lang="ts">
  import "../app.css";
  import Nav from "$lib/components/Nav.svelte";
  import Footer from "$lib/components/Footer.svelte";

  let { children } = $props();
</script>

<svelte:head>
  <title>eslint-plugin-postgresql</title>
</svelte:head>

<div class="app">
  <Nav />
  <main>
    {@render children?.()}
  </main>
  <Footer />
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  main {
    flex: 1;
  }
</style>
