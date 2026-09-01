<script setup>
import { onMounted, ref } from "vue";

const hydrated = ref(false);
onMounted(() => {
    hydrated.value = true;
});
</script>

<template>
    <h1 id="host-marker" :data-hydrated="hydrated ? 'true' : undefined">Host SSR Vue App</h1>
</template>
