import { parentPort, workerData } from "node:worker_threads";
import { pathToFileURL } from "node:url";

import { appInit } from "../../dist/index.js";
import { recomputeIconSet, setBuildContext } from "./startDevServer";
import { themeShortName } from "./themePkg";
import { writeHtml } from "./htmlOut";

/**
 * Prerender worker (Track 2, Stage 3). Each worker owns its OWN heap — globalThis
 * is NOT shared across threads — so it re-establishes the same data plane the main
 * thread built (appInit + theme/icon context + the seeded render bundle), then
 * drains a lock-free SharedArrayBuffer cursor of slugs, rendering each page and
 * writing its own <slug>.html (via the shared writeHtml so paths can't drift).
 *
 * The heavy one-time bundling/install main already did is NOT redone here: the
 * worker imports the SAME server bundle main built and reuses main's hashed asset
 * URLs, so every worker's shell is byte-identical to the serial build.
 */

export interface WorkerInput {
  cwd: string;
  host: string;
  isBin: boolean;
  /** Original process.argv.slice(2) — replayed so readSettings/fastServeSetup pick
   *  up a bare spec-arg build (`xyd build openapi.yaml`) exactly like main. */
  argv2: string[];
  /** Hashed asset URLs main computed once (client js, css, iconset, settings). */
  buildAssets: any;
  clientDir: string;
  /** The server render bundle main built/extracted — importing it registers
   *  globalThis.__xydRenderStatic / __xydSeedForBuild in this worker's heap. */
  serverBundlePath: string;
  /** Int32Array-backed shared cursor: Atomics.add hands out slug indices. */
  cursorSAB: SharedArrayBuffer;
  slugs: string[];
  accessMap: Record<string, string>;
  /** Main's serializable data plane (JSON) — adopted verbatim via appInit
   *  injectDataPlane (settings, nav, mapping, accessMap, i18n). */
  dataPlane: string;
}

// --- native core in the worker heap -------------------------------------------
// globalThis.__xydNativeCore isn't shared across threads. In the compiled binary the
// addon is embedded next to this worker (compile.ts stages it) and reached via a
// LITERAL require("./core.node") — the one edge bun --compile follows (same as
// native-boot). In dev that file is absent, so fall back to @xyd-js/native. Bun
// provides `require` in both bundled and directly-run modules.
declare const require: (id: string) => any;
function establishNative() {
  if (process.env.XYD_NATIVE === "0") return;
  let core: any = null;
  try {
    core = require("./core.node");
  } catch {
    try { core = require("@xyd-js/native"); } catch { core = null; }
  }
  if (core) (globalThis as any).__xydNativeCore = core;
}

async function run(input: WorkerInput) {
  // 1) Environment parity with buildStatic's own boot (utils/buildStatic set these).
  process.chdir(input.cwd);
  process.env.NODE_ENV = "production";
  process.env.XYD_HOST = input.host;
  process.env.XYD_BUN = "1";
  delete process.env.XYD_AUTH_BYPASS;
  // Replay the CLI args so readSettings/fastServeSetup resolve the same config
  // (docs.json OR a bare spec-arg build) main did.
  process.argv = [process.argv[0], process.argv[1], ...input.argv2];
  if (input.isBin) (globalThis as any).__xydCompiledBinary = true;

  establishNative();

  // 2) Rebuild this worker's render FUNCTIONS via loadPlugins (markdown plugins,
  //    components, hooks — non-serializable, so they can't be transferred), and adopt
  //    main's already-computed data plane (settings, nav, mapping, accessMap) verbatim.
  //    appInit SKIPS the generation (pluginDocs) under injectDataPlane, so there's no
  //    FS write/clear to race and the mapping matches main exactly.
  //    doNotInstallPluginDependencies: main already installed everything.
  const inited = await appInit({
    doNotInstallPluginDependencies: true,
    injectDataPlane: JSON.parse(input.dataPlane),
  } as any);
  if (!inited) throw new Error("worker appInit produced no settings");
  const settings = (globalThis as any).__xydSettings;

  // 3) Theme + icon context (same as main), then main's hashed asset URLs so the
  //    SSR shell matches byte-for-byte.
  const rawName: string = settings?.theme?.name || "poetry";
  const themeName = themeShortName(rawName);
  setBuildContext(input.host, rawName);
  await recomputeIconSet(settings);
  (globalThis as any).__xydBuildAssets = input.buildAssets;

  // 4) Import the ALREADY-BUILT server render bundle (registers __xydRenderStatic /
  //    __xydSeedForBuild in this heap) and seed the theme instance.
  await import(pathToFileURL(input.serverBundlePath).href);
  (globalThis as any).__xydSeedForBuild(themeName);

  parentPort!.postMessage({ type: "ready" });

  // 5) Work-stealing drain — Atomics.add hands each worker the next slug index.
  const cursor = new Int32Array(input.cursorSAB);
  const renderStatic = (globalThis as any).__xydRenderStatic;
  let ok = 0;
  const missing: string[] = [];
  for (;;) {
    const i = Atomics.add(cursor, 0, 1);
    if (i >= input.slugs.length) break;
    const slug = input.slugs[i];
    try {
      const acc = input.accessMap["/" + slug] || input.accessMap[slug];
      const shellOnly = !!acc && acc !== "public";
      const html = await renderStatic(slug, { shellOnly });
      writeHtml(input.clientDir, slug, html);
      ok++;
    } catch (e: any) {
      missing.push(`${slug}: ${e?.message || e}`);
    }
  }
  parentPort!.postMessage({ type: "result", ok, missing });
}

run(workerData as WorkerInput).catch((e: any) => {
  parentPort!.postMessage({ type: "error", fatal: true, reason: String(e?.stack || e) });
});
