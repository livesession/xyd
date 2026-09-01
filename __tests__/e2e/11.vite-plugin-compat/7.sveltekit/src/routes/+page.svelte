<script>
    import { onMount } from "svelte";
    let hydrated = false;
    onMount(() => {
        hydrated = true;
    });
</script>

<h1 id="host-marker" data-hydrated={hydrated ? "true" : undefined}>Host SvelteKit App</h1>
