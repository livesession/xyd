import type { BunPlugin } from "bun";
import * as path from "node:path";
import * as fs from "node:fs";
import { pathToFileURL } from "node:url";

// appInit + getHostPath + pluginIconSet from documan's BUILT dist (picocolors
// etc. bundled). The bun/* sources are raw TSX run by Bun; the heavy engine
// (settings/plugin loading) stays in the compiled dist.
import { appInit, getHostPath, pluginIconSet } from "../../dist/index.js";

/**
 * S1 dev server (Bun.serve + Bun.build — no Vite, no React Router). Reusable
 * boot: runs appInit (sets the runtime globals), bundles the browser client +
 * the bun server render, starts serving, and (via the watcher, wired in
 * `startWatcher`) hot-reloads on change. Called both by the standalone
 * `launcher.ts` shim and — behind `XYD_BUN` — by the CLI's `dev` command.
 *
 * `Bun.build`'s build-time `onResolve` DOES rewrite the static import graph
 * (unlike runtime `--preload`), which is what lets us resolve react/@xyd-js/
 * theme from `.xyd/host` (one deduped react) and alias `react-router` → the
 * shim, with zero node_modules mutation.
 */

const DIR = import.meta.dir;

// Optional packages only present when a feature (e.g. diagrams) is enabled;
// stub to empty so the bundle builds without them.
const OPTIONAL = /^(rehype-mermaid|rehype-graphviz|@hpcc-js\/wasm|playwright|puppeteer)(\/|$)/;
// @xyd-js/composer is server-only (pulls node built-ins via babel) — stub it out
// of the CLIENT bundle (never instantiated there; seedGlobals guards it).
const SERVER_ONLY = /^@xyd-js\/composer(\/|$)/;

// Module-scoped so rebuild() (in startWatcher) can re-bundle without re-reading args.
let HOST = "";
let themeName = "poetry";
let iconSetJson = "{}";

export interface DevServerHandle {
  server: any; // Bun.Server
  rebuild: (kind: string, paths: string[]) => Promise<void>;
  close: () => void;
}

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

async function buildBundle(
  name: string,
  entrySrc: string,
  target: "bun" | "browser",
  external: string[],
  isClient = false
): Promise<string> {
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
    console.error(`[dev] ${name} bundle FAILED:`);
    for (const l of res.logs) console.error(String(l));
    process.exit(1);
  }
  return res.outputs.find((o) => o.kind === "entry-point")!.path;
}

/** Compute the real icon set (virtual:xyd-icon-set) so string-name icons
 *  (e.g. "docs:slack") resolve identically on the server AND the client. */
async function recomputeIconSet(s: any): Promise<void> {
  let iconSet: Record<string, { svg: string }> = {};
  try {
    const plugin: any = pluginIconSet(s);
    const code = await plugin.load.call(plugin, "virtual:xyd-icon-set");
    const m = String(code).match(/export const iconSet = ([\s\S]*);/);
    iconSet = m ? JSON.parse(m[1]) : {};
  } catch (e) {
    console.error("[dev] iconSet compute failed (icons will be empty):", (e as any)?.message);
  }
  (globalThis as any).__xydIconSet = iconSet;
  iconSetJson = JSON.stringify(iconSet);
  console.error("[dev] icon set:", Object.keys(iconSet).length, "icons");
}

async function rebundleClient(): Promise<string> {
  const bundle = await buildBundle(
    "client",
    `globalThis.__xydIconSet = ${iconSetJson};\nimport Theme from "@xyd-js/theme-${themeName}";\nimport { bootClient } from "./client-entry";\nbootClient(Theme);\n`,
    "browser",
    [],
    true
  );
  process.env.XYD_CLIENT_BUNDLE = bundle;
  return bundle;
}

async function rebundleServer(): Promise<string> {
  // The entry exposes callables on globalThis instead of calling start()
  // directly, so startDevServer can capture the returned Bun.serve handle and
  // trigger a re-seed after a hot re-appInit.
  return buildBundle(
    "server",
    `import Theme from "@xyd-js/theme-${themeName}";\n` +
      `import { start, reseed } from "./renderPage";\n` +
      `globalThis.__xydBunStart  = () => start(Theme);\n` +
      `globalThis.__xydBunReseed = () => reseed(Theme);\n`,
    "bun",
    // Heavy/self-referential tools that read their own files via import.meta.url
    // break when inlined — load them from disk instead. Not needed to render prose.
    ["typedoc", "@xyd-js/sources", "shiki", "vscode-oniguruma", "vscode-textmate"]
  );
}

let importSalt = 0;
async function importFresh(bundlePath: string): Promise<void> {
  // Bun caches by specifier; a query bust re-runs a rebuilt server bundle.
  const href = pathToFileURL(bundlePath).href + (importSalt ? `?t=${importSalt}` : "");
  importSalt++;
  await import(href);
}

export async function startDevServer(cwd: string = process.cwd(), opts: { port?: number } = {}): Promise<DevServerHandle> {
  process.chdir(cwd); // appInit + ContentFS are cwd-relative
  process.env.XYD_PORT ??= String(opts.port ?? 5175);

  console.error("[dev] appInit…");
  await appInit();
  const settings = (globalThis as any).__xydSettings;
  if (!settings) {
    console.error("[dev] appInit produced no settings");
    process.exit(1);
  }

  HOST = getHostPath();
  process.env.XYD_HOST = HOST;
  const rawName: string = settings?.theme?.name || "poetry";
  themeName = rawName.startsWith("npm:") ? rawName.slice("npm:".length) : rawName;
  console.error("[dev] host:", HOST, "| theme:", themeName);

  await recomputeIconSet(settings);
  console.error("[dev] bundling client (browser)…");
  await rebundleClient();
  console.error("[dev] bundling server (bun)…");
  const serverBundle = await rebundleServer();

  await importFresh(serverBundle);
  const server = (globalThis as any).__xydBunStart();
  if (!server) {
    console.error("[dev] server handle is null — __xydBunStart did not return the Bun.serve instance");
    process.exit(1);
  }

  // rebuild + watcher are wired in a later step; for now expose a no-op rebuild.
  const handle: DevServerHandle = {
    server,
    rebuild: async () => {},
    close: () => server.stop(),
  };
  return handle;
}
