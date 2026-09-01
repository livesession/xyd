<script setup>
const BRAND_PATH = "M24,1.61H14.06L12,5.16,9.94,1.61H0L12,22.39ZM12,14.08,5.16,2.23H9.59L12,6.41l2.41-4.18h4.43Z";
</script>

<template>
    <header>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="BRAND_PATH" /></svg>
        <span class="name">Vue</span>
        <nav><a href="/docs">Docs</a></nav>
    </header>
    <main>
        <div>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="BRAND_PATH" /></svg>
            <h1 id="host-marker">Host Vue SPA App</h1>
            <p class="tag">A Vue site with xyd docs mounted at /docs — one build, one origin.</p>
        </div>
    </main>
</template>
