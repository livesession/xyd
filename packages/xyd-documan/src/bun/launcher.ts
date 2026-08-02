import type { BunPlugin } from "bun";
import * as path from "node:path";
import * as fs from "node:fs";

// appInit + getHostPath from documan's BUILT dist (picocolors etc. bundled).
import { appInit, getHostPath } from "../../dist/index.js";

/**
 * S1 dev-server launcher. Runs appInit (sets the runtime globals), then bundles
 * the render with `Bun.build` — whose build-time `onResolve` DOES rewrite the
 * static import graph, unlike runtime `--preload`. That lets us resolve
 * react/@xyd-js/theme from `.xyd/host` (one deduped react baked into the
 * bundle) and alias `react-router` → the shim, with zero node_modules mutation.
 *
 *   cd apps/docs && XYD_DEV_MODE=1 bun ../../packages/xyd-documan/src/bun/launcher.ts
 */

const DIR = import.meta.dir;

console.error("[launcher] appInit…");
await appInit();
const settings = (globalThis as any).__xydSettings;
if (!settings) {
  console.error("[launcher] appInit produced no settings");
  process.exit(1);
}

const HOST = getHostPath();
process.env.XYD_HOST = HOST;
const rawName: string = settings?.theme?.name || "poetry";
const themeName = rawName.startsWith("npm:") ? rawName.slice("npm:".length) : rawName;
console.error("[launcher] host:", HOST, "| theme:", themeName);

// Generated entry with a STATIC theme import so react + the theme dedupe into
// one bundle (a runtime dynamic import would load a second react from disk).
// Optional packages only present when a feature (e.g. diagrams) is enabled;
// stub to empty so the bundle builds without them.
const OPTIONAL = /^(rehype-mermaid|rehype-graphviz|@hpcc-js\/wasm|playwright|puppeteer)(\/|$)/;

// @xyd-js/composer is server-only (pulls node built-ins via babel) — stub it out
// of the CLIENT bundle (never instantiated there; seedGlobals guards it).
const SERVER_ONLY = /^@xyd-js\/composer(\/|$)/;

function makeShims(isClient: boolean): BunPlugin {
  return {
  name: "xyd-render-shims",
  setup(b) {
    if (isClient) b.onResolve({ filter: SERVER_ONLY }, () => ({ path: path.join(DIR, "composer-stub.js") }));
    b.onResolve({ filter: OPTIONAL }, () => ({ path: path.join(DIR, "empty.js") }));
    b.onResolve({ filter: /^react-router(-dom)?$/ }, () => ({ path: path.join(DIR, "rr-shim.tsx") }));
    b.onResolve({ filter: /^(react$|react\/|react-dom$|react-dom\/|@xyd-js\/)/ }, (args) => {
      try {
        return { path: Bun.resolveSync(args.path, HOST) };
      } catch {
        return undefined;
      }
    });
    b.onLoad({ filter: /\.css$/ }, () => ({ contents: "export default {};", loader: "js" }));
  },
  };
}

// STATIC theme import so react + the theme dedupe into ONE bundle.
async function buildBundle(name: string, entrySrc: string, target: "bun" | "browser", external: string[], isClient = false) {
  const entryPath = path.join(DIR, `.entry.${name}.tsx`);
  fs.writeFileSync(entryPath, entrySrc);
  const res = await Bun.build({
    entrypoints: [entryPath],
    target,
    outdir: path.join(DIR, ".bundle", name),
    plugins: [makeShims(isClient)],
    sourcemap: "inline",
    external,
  });
  if (!res.success) {
    console.error(`[launcher] ${name} bundle FAILED:`);
    for (const l of res.logs) console.error(String(l));
    process.exit(1);
  }
  return res.outputs.find((o) => o.kind === "entry-point")!.path;
}

console.error("[launcher] bundling client (browser)…");
const clientBundle = await buildBundle(
  "client",
  `import Theme from "@xyd-js/theme-${themeName}";\nimport { bootClient } from "./client-entry";\nbootClient(Theme);\n`,
  "browser",
  [],
  true
);
process.env.XYD_CLIENT_BUNDLE = clientBundle;
console.error("[launcher] client bundle ok →", clientBundle);

console.error("[launcher] bundling server (bun)…");
const serverBundle = await buildBundle(
  "server",
  `import Theme from "@xyd-js/theme-${themeName}";\nimport { start } from "./renderPage";\nstart(Theme);\n`,
  "bun",
  // Heavy/self-referential tools that read their own files via import.meta.url
  // break when inlined — load them from disk instead. Not needed to render prose.
  ["typedoc", "@xyd-js/sources", "shiki", "vscode-oniguruma", "vscode-textmate"]
);
console.error("[launcher] server bundle ok; starting server…");
await import(serverBundle);
