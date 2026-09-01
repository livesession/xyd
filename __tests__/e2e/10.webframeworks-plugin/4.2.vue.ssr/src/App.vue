<script setup>
import { onMounted, ref } from "vue";

const BRAND_PATH = "M24,1.61H14.06L12,5.16,9.94,1.61H0L12,22.39ZM12,14.08,5.16,2.23H9.59L12,6.41l2.41-4.18h4.43Z";
const hydrated = ref(false);
onMounted(() => {
    hydrated.value = true;
});
</script>

<template>
    <header>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="BRAND_PATH" /></svg>
        <span class="name">Vue SSR</span>
        <nav><a href="/docs">Docs</a></nav>
    </header>
    <main>
        <div>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="BRAND_PATH" /></svg>
            <h1 id="host-marker" :data-hydrated="hydrated ? 'true' : undefined">Host SSR Vue App</h1>
            <p class="tag">A Vue SSR site with xyd docs mounted at /docs — one build, one origin.</p>
        </div>
    </main>
</template>

<!-- unscoped: page-level styles; kept in the SFC (not index.html) because vite 8's
     dev transformIndexHtml chokes on inline <style> in a middlewareMode template -->
<style>
:root{--brand:#4FC08D}
*{margin:0;box-sizing:border-box}
body{font-family:ui-sans-serif,system-ui,sans-serif;background:#0b0c0f;color:#e8e9ec;min-height:100vh}
header{display:flex;align-items:center;gap:12px;padding:16px 32px;border-bottom:1px solid #23252b}
header svg{width:28px;height:28px;fill:var(--brand)}
header .name{font-weight:600;font-size:17px}
header nav{margin-left:auto}
header nav a{color:#0b0c0f;background:var(--brand);padding:8px 18px;border-radius:8px;text-decoration:none;font-weight:600}
main{display:grid;place-items:center;min-height:calc(100vh - 62px);text-align:center;padding:24px}
main svg{width:72px;height:72px;fill:var(--brand);margin-bottom:24px}
h1{font-size:40px;letter-spacing:-.02em}
p.tag{color:#9a9ca6;margin-top:12px;font-size:17px}
.jsnote{color:#565963;font-size:12px;margin-top:32px}
</style>
