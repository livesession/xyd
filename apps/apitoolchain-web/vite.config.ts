import { apitoolchainViteDev } from "@apitoolchain/dev/vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

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
  // Transpile the linked design-system TS source (it ships source, not dist) for
  // both the SSR and client builds instead of treating it as an external dep.
  ssr: { noExternal: ["@apitoolchain/design-system"] },
  optimizeDeps: { exclude: ["@apitoolchain/design-system"] },
});
