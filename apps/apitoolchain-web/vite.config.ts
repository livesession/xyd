// Imported by relative source path (not the "@apitoolchain/dev/vite" package
// specifier) so Vite's config loader bundles the plugin's TS inline. As an
// external package, Node would try to type-strip its `.ts` — which it refuses
// to do under node_modules — breaking `bun run dev`.

import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { apitoolchainViteDev } from "../../packages/apitoolchain-dev/src/vite";

export default defineConfig({
  // `apitoolchainViteDev` (dev only) boots Postgres + MinIO + both backend
  // services via testcontainers, so `bun run dev` here runs the whole stack.
  // Skip with APITOOLCHAIN_STACK=off, or point at an external backend by
  // pre-setting APITOOLCHAIN_API_URL.
  plugins: [apitoolchainViteDev(), tailwindcss(), reactRouter()],
  resolve: {
    // Vite 8 resolves tsconfig `paths` (the `~/*` alias) natively.
    tsconfigPaths: true,
    // The design system is a source-exported linked package; keep a single React.
    dedupe: ["react", "react-dom"],
  },
  // Transpile the linked source-exported packages (design-system + filters ship
  // TS source, not dist) for both the SSR and client builds instead of treating
  // them as external deps. `kysely` (a real dep of @apitoolchain/filters) is
  // bundled through it — its compile-only path is isomorphic.
  ssr: {
    noExternal: [
      "@apitoolchain/design-system",
      "@apitoolchain/filters",
      // The dev widget (@apitoolchain/dev/widget) ships TS source too; only
      // its React export is pulled in (not the Node-side ./vite plugin).
      "@apitoolchain/dev",
    ],
  },
  optimizeDeps: {
    exclude: [
      "@apitoolchain/design-system",
      "@apitoolchain/filters",
      "@apitoolchain/dev",
    ],
  },
});
