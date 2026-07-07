// Imported by relative source path (not the "@apitoolchain/dev/vite" package
// specifier) so Vite's config loader bundles the plugin's TS inline. As an
// external package, Node would try to type-strip its `.ts` — which it refuses
// to do under node_modules — breaking `bun run dev`.

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import { apitoolchainViteDev } from "../../packages/apitoolchain-dev/src/vite";

const here = dirname(fileURLToPath(import.meta.url));
/** Built dist of a xyd workspace package (`../../packages/xyd-<name>/...`). */
const xyd = (p: string) => resolve(here, "../../packages", p);

/**
 * Shim `path` → path-browserify, but ONLY in the client environment. The xyd
 * dist imports `path` and calls `path.join` at runtime, which the browser lacks.
 * The server (SSR) must keep the real `node:path`: path-browserify is CommonJS,
 * and Vite's dev SSR module runner can't evaluate it (`module is not defined`).
 * A per-environment `resolveId` beats a global `resolve.alias` (which would hit
 * both).
 */
function clientPathShim(): Plugin {
  // A virtual module (not path-browserify directly): path-browserify is CJS with
  // a single `module.exports = {…}`, so importing it as ESM yields no `default`
  // export — `import path from "path"` then fails with "does not provide an
  // export named 'default'". This wrapper republishes a proper default + named
  // exports so both `import path from "path"` and `import { join } from "path"`
  // resolve in the browser.
  const VIRTUAL = "\0apitoolchain:path-shim";
  return {
    name: "apitoolchain-client-path-shim",
    enforce: "pre",
    resolveId(id, _importer, options) {
      // Everything that isn't the SSR environment is the browser; only SSR keeps
      // real node:path. Check both the Environment API name and the classic
      // `ssr` flag so it's robust across Vite versions.
      const ssr = this.environment?.name === "ssr" || options?.ssr === true;
      if (!ssr && (id === "path" || id === "node:path")) {
        return VIRTUAL;
      }
    },
    load(id) {
      if (id !== VIRTUAL) return;
      // Bare specifier: resolves from the app root (path-browserify is a direct
      // dep) — NOT from the xyd dist that triggered the shim — and is pre-bundled
      // via `optimizeDeps.include` below, so esbuild synthesizes a clean default.
      return [
        `import * as mod from "path-browserify";`,
        // Robust whether the interop exposes the CJS export as `default`, as
        // named members, or only on the namespace.
        `const path = mod.default ?? mod;`,
        `export default path;`,
        `export const { basename, delimiter, dirname, extname, format, isAbsolute, join, normalize, parse, relative, resolve, sep } = path;`,
      ].join("\n");
    },
  };
}

export default defineConfig({
  // `apitoolchainViteDev` (dev only) boots Postgres + MinIO + both backend
  // services via testcontainers, so `bun run dev` here runs the whole stack.
  // Skip with APITOOLCHAIN_STACK=off, or point at an external backend by
  // pre-setting APITOOLCHAIN_API_URL.
  plugins: [
    clientPathShim(),
    apitoolchainViteDev(),
    tailwindcss(),
    reactRouter(),
  ],
  resolve: {
    // Vite 8 resolves tsconfig `paths` (the `~/*` alias) natively.
    tsconfigPaths: true,
    // The design system is a source-exported linked package; keep a single React.
    dedupe: ["react", "react-dom"],
    // The OpenAPI editor renders specs with xyd Atlas + the xyd docs runtime.
    // Those packages aren't installable here (this app is excluded from the
    // @xyd-js workspace), so alias straight at their self-contained built dist —
    // the apiatlas pattern. `resolve.alias` runs before tsconfig-paths, so it's
    // the runtime resolver; tsconfig `paths` supplies the types. `path` is
    // shimmed because xyd-openapi's dist calls `path.join` at runtime (its
    // top-level `fs/promises` import is never invoked client-side — we use the
    // ref-parser deref, not xyd's Node-only `deferencedOpenAPI`).
    alias: [
      { find: /^@xyd-js\/atlas$/, replacement: xyd("xyd-atlas/dist/index.js") },
      {
        find: /^@xyd-js\/uniform$/,
        replacement: xyd("xyd-uniform/dist/index.js"),
      },
      {
        find: /^@xyd-js\/framework\/react$/,
        replacement: xyd("xyd-framework/dist/react.js"),
      },
      {
        find: /^@xyd-js\/framework\/hydration$/,
        replacement: xyd("xyd-framework/dist/hydration.js"),
      },
      {
        find: /^@xyd-js\/framework$/,
        replacement: xyd("xyd-framework/dist/index.js"),
      },
      {
        find: /^@xyd-js\/openapi$/,
        replacement: xyd("xyd-openapi/dist/index.js"),
      },
      {
        find: /^@xyd-js\/components\/content$/,
        replacement: xyd("xyd-components/dist/content.js"),
      },
      {
        find: /^@xyd-js\/components\/writer$/,
        replacement: xyd("xyd-components/dist/writer.js"),
      },
      {
        find: /^@xyd-js\/components$/,
        replacement: xyd("xyd-components/dist/index.js"),
      },
      {
        find: /^@xyd-js\/theme-opener$/,
        replacement: xyd("xyd-theme-opener/dist/index.js"),
      },
    ],
  },
  // `@apidevtools/json-schema-ref-parser` → `@jsdevtools/ono` → the `util`
  // polyfill reads `process.env.*` at module-init, and the browser has no
  // `process`. Substitute at build time — CLIENT ONLY, so SSR keeps the real
  // `process.env` (the `~/data` loaders read APITOOLCHAIN_API_URL). Longest
  // match wins: NODE_DEBUG → undefined, any other `process.env.X` → `({}).X`.
  environments: {
    client: {
      define: {
        "process.env.NODE_DEBUG": "undefined",
        "process.env": "{}",
      },
    },
  },
  server: {
    // The aliased xyd dist lives at ../../packages (outside this app's Vite
    // root); widen the fs allow-list so the dev server can read it.
    fs: { allow: [resolve(here, "../..")] },
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
    // Pre-bundle the CJS path-browserify so the client `path` shim gets a clean
    // synthesized default export (see clientPathShim).
    include: ["path-browserify"],
    exclude: [
      "@apitoolchain/design-system",
      "@apitoolchain/filters",
      "@apitoolchain/dev",
    ],
  },
});
