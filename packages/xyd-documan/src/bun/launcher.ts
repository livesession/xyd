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
const entryPath = path.join(DIR, ".entry.tsx");
fs.writeFileSync(
  entryPath,
  `import Theme from "@xyd-js/theme-${themeName}";\nimport { start } from "./renderPage";\nstart(Theme);\n`
);

// Optional packages only present when a feature (e.g. diagrams) is enabled;
// stub to empty so the bundle builds without them.
const OPTIONAL = /^(rehype-mermaid|rehype-graphviz|@hpcc-js\/wasm|playwright|puppeteer)(\/|$)/;

const shims: BunPlugin = {
  name: "xyd-render-shims",
  setup(b) {
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

console.error("[launcher] bundling render…");
const out = await Bun.build({
  entrypoints: [entryPath],
  target: "bun",
  outdir: path.join(DIR, ".bundle"),
  plugins: [shims],
  sourcemap: "inline",
  // Heavy/self-referential tools that read their own files via import.meta.url
  // break when inlined — load them from disk instead. Not needed to render prose.
  external: ["typedoc", "@xyd-js/sources", "shiki", "vscode-oniguruma", "vscode-textmate"],
});
if (!out.success) {
  console.error("[launcher] bundle FAILED:");
  for (const l of out.logs) console.error(String(l));
  process.exit(1);
}
console.error("[launcher] bundle ok; starting server…");
await import(out.outputs.find((o) => o.kind === "entry-point")!.path);
