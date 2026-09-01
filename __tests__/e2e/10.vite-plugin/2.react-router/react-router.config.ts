import type { Config } from "@react-router/dev/config";

// ssr + prerender mirrors apps/website — the adoption-critical configuration.
// It exercises the two-vite-build (client + SSR) + prerender path the plugin
// must sequence correctly (merge only after the FINAL build).
export default { ssr: true, prerender: true } satisfies Config;
