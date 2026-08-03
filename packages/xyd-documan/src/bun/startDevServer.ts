import type { BunPlugin } from "bun";
import * as path from "node:path";
import * as fs from "node:fs";
import { pathToFileURL } from "node:url";

// appInit + getHostPath + pluginIconSet from documan's BUILT dist (picocolors
// etc. bundled). The bun/* sources are raw TSX run by Bun; the heavy engine
// (settings/plugin loading) stays in the compiled dist.
import { appInit, getHostPath, pluginIconSet } from "../../dist/index.js";
import { startWatcher, type WatchHandle } from "./watcher";

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

/** Set the module-scoped bundler context (HOST + theme) so the exported
 *  primitives (makeShims/buildBundle/recomputeIconSet) work when called from
 *  buildStatic — mirrors what startDevServer sets during a dev boot. */
export function setBuildContext(host: string, theme: string) {
  HOST = host;
  themeName = theme;
}

/** Resolve @xyd-js/router (the react-router replacement) — HOST first, then
 *  documan's own tree (both resolve the same workspace package in dev). */
export function resolveRouter(): string {
  for (const base of [HOST, DIR]) {
    if (!base) continue;
    try {
      return Bun.resolveSync("@xyd-js/router", base);
    } catch {}
  }
  // Last resort: the workspace source dist relative to documan.
  return path.resolve(DIR, "../../../xyd-router/dist/index.js");
}

export interface DevServerHandle {
  server: any; // Bun.Server
  rebuild: (kind: string, paths: string[]) => Promise<void>;
  close: () => void;
}

export function makeShims(isClient: boolean): BunPlugin {
  return {
    name: "xyd-render-shims",
    setup(b) {
      if (isClient) b.onResolve({ filter: SERVER_ONLY }, () => ({ path: path.join(DIR, "composer-stub.js") }));
      b.onResolve({ filter: OPTIONAL }, () => ({ path: path.join(DIR, "empty.js") }));
      // react-router → @xyd-js/router (S2). One point redirects BOTH third-party
      // leaf imports and xyd's own, for client + server bundles. Resolve from
      // HOST (production .xyd/host declares it) with a fallback to documan's own
      // tree (dev: repo .xyd/host may be stale but documan depends on it); its
      // `react` still dedupes via the react onResolve below.
      b.onResolve({ filter: /^react-router(-dom)?$/ }, () => ({ path: resolveRouter() }));
      b.onResolve({ filter: /^(react$|react\/|react-dom$|react-dom\/|@xyd-js\/)/ }, (args) => {
        // @xyd-js/router isn't in the (possibly stale) HOST tree — resolve it the
        // same way the react-router alias does, so the direct import here and the
        // aliased leaf imports collapse to ONE module (one RouterContext).
        if (args.path === "@xyd-js/router") return { path: resolveRouter() };
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

export interface BundleOverrides {
  outdir?: string;
  naming?: any;
  minify?: boolean;
  sourcemap?: "none" | "linked" | "external" | "inline";
  returnResult?: boolean; // return the full Bun.build result (for hashed asset paths)
}

export async function buildBundle(
  name: string,
  entrySrc: string,
  target: "bun" | "browser",
  external: string[],
  isClient = false,
  overrides?: BundleOverrides
): Promise<any> {
  const entryPath = path.join(DIR, `.entry.${name}.tsx`);
  fs.writeFileSync(entryPath, entrySrc);
  const res = await Bun.build({
    entrypoints: [entryPath],
    target,
    outdir: overrides?.outdir ?? path.join(DIR, ".bundle", name),
    plugins: [makeShims(isClient)],
    // The CLIENT bundle is served to the browser on every page load — minify it
    // and keep the sourcemap EXTERNAL (a `.map` file fetched only when devtools
    // open) instead of inline, which was ~66% of the payload. The SERVER bundle
    // runs in-process (never served) so size is irrelevant — keep its inline map
    // for readable stack traces. The static build overrides these (hashed names,
    // minified, no sourcemap).
    minify: overrides?.minify ?? target === "browser",
    sourcemap: overrides?.sourcemap ?? (target === "browser" ? "linked" : "inline"),
    ...(overrides?.naming ? { naming: overrides.naming } : {}),
    external,
  });
  if (!res.success) {
    // Throw (don't process.exit) — a hot rebuild (icon/theme) with a bad build
    // must NOT tear down the running dev server; the caller decides (fatal only
    // on first boot).
    throw new Error(`${name} bundle failed:\n${res.logs.map((l) => String(l)).join("\n")}`);
  }
  if (overrides?.returnResult) return res;
  return res.outputs.find((o) => o.kind === "entry-point")!.path;
}

/** Compute the real icon set (virtual:xyd-icon-set) so string-name icons
 *  (e.g. "docs:slack") resolve identically on the server AND the client.
 *  Returns the JSON string (inlined into the client bundle entry). */
export async function recomputeIconSet(s: any): Promise<string> {
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
  return iconSetJson;
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

export async function startDevServer(
  cwd: string = process.cwd(),
  opts: { port?: number; skipInstall?: boolean } = {}
): Promise<DevServerHandle> {
  process.chdir(cwd); // appInit + ContentFS are cwd-relative
  process.env.XYD_PORT ??= String(opts.port ?? 5175);

  console.error("[dev] appInit…");
  // First boot may install plugin deps; a restart-triggered re-boot must NOT
  // (blocking pm install while the server is down + lockfile writes on every
  // .env/theme edit). skipInstall is set by restart().
  await appInit(opts.skipInstall ? ({ doNotInstallPluginDependencies: true } as any) : undefined);
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
  let serverBundle: string;
  try {
    console.error("[dev] bundling client (browser)…");
    await rebundleClient();
    console.error("[dev] bundling server (bun)…");
    serverBundle = await rebundleServer();
  } catch (e) {
    // Can't serve without the initial bundles — this IS fatal (unlike a hot
    // rebuild, where buildBundle's throw is caught and the old bundle retained).
    console.error("[dev] initial bundle failed — cannot start dev server:\n", (e as any)?.message || e);
    process.exit(1);
  }

  await importFresh(serverBundle);
  const server = (globalThis as any).__xydBunStart();
  if (!server) {
    console.error("[dev] server handle is null — __xydBunStart did not return the Bun.serve instance");
    process.exit(1);
  }

  let watcher: WatchHandle | null = null;
  const stop = () => {
    watcher?.stop();
    // Force-close active connections (true) — a graceful stop() keeps the
    // live-reload websocket alive, so the browser never drops it and can't
    // reconnect to the restarted server. Forcing the drop triggers the client's
    // reconnect-and-reload recovery.
    server.stop(true);
  };
  const rebuild = makeRebuild({ server, cwd, opts, stop });
  watcher = startWatcher(cwd, rebuild);
  console.error("[dev] watching for changes…");

  return { server, rebuild, close: stop };
}

function themeName_(): string {
  return (globalThis as any).__xydSettings?.theme?.name || "";
}

/**
 * The single kind→action dispatcher the watcher drives. Small phases:
 *   reinit  = re-run appInit (fresh settings/pagePathMapping/plugins) WITHOUT
 *             re-installing plugin deps (guard: utils.ts doNotInstallPluginDependencies)
 *   reseed  = re-strip element icons + rebuild the theme (SSR≠CSR safety)
 *   reload  = broadcast to the browser's live-reload socket
 *   restart = full re-boot (only theme.name — it's baked into both bundles)
 * Most kinds skip re-bundling: renderPage reads __xydPagePathMapping/plugins and
 * ContentFS reads files FRESH per request, so a plain reload re-renders new data.
 */
function makeRebuild(ctx: {
  server: any;
  cwd: string;
  opts: { port?: number; skipInstall?: boolean };
  stop: () => void;
}) {
  const reinit = () => appInit({ doNotInstallPluginDependencies: true } as any);
  const reseed = () => (globalThis as any).__xydBunReseed();
  const reload = () => ctx.server.publish("xyd-reload", "reload");
  const restart = async () => {
    ctx.stop();
    // skipInstall: a restart must not re-run the blocking pm install (the guard
    // the hot-reload path already uses). Only the very first boot installs.
    await startDevServer(ctx.cwd, { ...ctx.opts, skipInstall: true });
  };

  return async function rebuild(kind: string, paths: string[]): Promise<void> {
    try {
      switch (kind) {
        case "content": {
          // ContentFS reads .md/.mdx FRESH per request → an edit needs only a
          // reload. Add/rename/delete changes the page set → reinit to refresh
          // pagePathMapping + sidebar first.
          if (contentTopologyChanged(ctx.cwd, paths)) {
            await reinit();
            reseed();
          }
          reload();
          break;
        }
        case "settings": {
          // theme.name changes are baked into both bundles → need a full restart.
          const before = themeName_();
          await reinit();
          if (themeName_() !== before) return await restart();
          reseed();
          reload();
          break;
        }
        case "api": {
          await reinit();
          reseed();
          reload();
          break;
        }
        case "icon": {
          // The icon set is inlined into the client bundle AND held on the server
          // global — recompute both, re-bundle client, reload.
          await recomputeIconSet((globalThis as any).__xydSettings);
          await rebundleClient();
          reload();
          break;
        }
        case "env":
          // appInit → readSettings → loadEnvFiles re-reads .env (override:true)
          // and re-substitutes $VARs, so reinit picks up env changes WITHOUT a
          // full restart — no server-down window, no re-import module leak, no
          // blocking install. (A full restart is reserved for theme.name.)
          await reinit();
          reseed();
          reload();
          break;
        case "public":
          reload();
          break;
        default:
          break; // "other" → ignore
      }
    } catch (e) {
      console.error(`[dev] rebuild(${kind}) failed:`, e);
    }
  };
}

/** True when a content change added/renamed/deleted a page (not just an edit). */
function contentTopologyChanged(cwd: string, paths: string[]): boolean {
  const mapping = (globalThis as any).__xydPagePathMapping || {};
  const known = new Set<string>(Object.values(mapping).map((v: any) => path.resolve(cwd, String(v))));
  for (const p of paths) {
    const abs = path.resolve(cwd, p);
    if (!known.has(abs)) return true; // new/renamed (or path-form mismatch → safe reinit)
    if (!fs.existsSync(abs)) return true; // deleted
  }
  return false;
}
