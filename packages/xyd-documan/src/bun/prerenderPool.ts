import * as os from "node:os";

import { writeHtml } from "./htmlOut";
import type { WorkerInput } from "./prerenderWorker";

/**
 * Prerender orchestration for the Bun static build. The content-page loop lives
 * behind a stable { ok, missing } contract so it can run either as the in-process
 * serial loop (default / fallback) or across a worker pool — with byte-identical
 * output. Each page render is a pure function of the slug + the read-only render
 * globals and writes its own file, so parallelizing it is order-independent.
 */

export interface PrerenderCtx {
  /** `.xyd/build/client` — the publish dir. */
  clientDir: string;
  /** Content-page slugs (Object.keys(__xydPagePathMapping)). */
  slugs: string[];
  /** Page → access level ("public" | "authenticated" | groups). */
  accessMap: Record<string, string>;
  /** Main's serializable data plane (JSON): settings, nav, mapping, accessMap, i18n.
   *  Workers adopt it verbatim (appInit injectDataPlane) instead of re-generating. */
  dataPlane: string;
  // --- fields the worker pool needs to rebuild its own heap (ignored by serial) ---
  cwd: string;
  host: string;
  isBin: boolean;
  /** process.argv.slice(2) — replayed in workers so a bare spec-arg build resolves. */
  argv2: string[];
  /** Hashed asset URLs main computed once (so worker shells match). */
  buildAssets: any;
  /** The server render bundle main built/extracted; workers import the same one. */
  serverBundlePath: string;
}

export interface PrerenderResult {
  ok: number;
  /** Per-page failures ("<slug>: <message>") — buildStatic fails loud on any. */
  missing: string[];
}

/** Render one content page to `<slug>.html`. Pure fn of the slug + the read-only
 *  render globals; a protected page (no deploy adapter) renders an empty shell. */
async function renderOne(ctx: PrerenderCtx, slug: string): Promise<void> {
  const acc = ctx.accessMap["/" + slug] || ctx.accessMap[slug];
  const shellOnly = !!acc && acc !== "public"; // static host = no deploy adapter → always shell
  const html = await (globalThis as any).__xydRenderStatic(slug, { shellOnly });
  writeHtml(ctx.clientDir, slug, html);
}

/** In-process serial prerender — the default path and the fallback whenever the
 *  worker pool is disabled or unavailable. Byte-identical to buildStatic's loop. */
export async function prerenderPagesSerial(ctx: PrerenderCtx): Promise<PrerenderResult> {
  let ok = 0;
  const missing: string[] = [];
  for (const slug of ctx.slugs) {
    try {
      await renderOne(ctx, slug);
      ok++;
    } catch (e: any) {
      missing.push(`${slug}: ${e?.message || e}`);
    }
  }
  return { ok, missing };
}

/** Resolve the worker count. Default is 1 (serial) — the pool is opt-in via
 *  XYD_BUILD_CONCURRENCY while it stabilizes. `auto` → cpus-1. Capped at 8 and the
 *  page count; tiny sites stay serial (pool boot would exceed the saving). */
function decideConcurrency(slugCount: number): number {
  const env = process.env.XYD_BUILD_CONCURRENCY;
  let n: number;
  if (env === undefined || env === "") n = 1;
  else if (env === "auto") n = Math.max(1, ((os.availableParallelism?.() ?? os.cpus().length) || 2) - 1);
  else n = Math.max(1, parseInt(env, 10) || 1);
  n = Math.min(n, 8, slugCount);
  if (slugCount < 16) return 1; // pool overhead not worth it
  return n;
}

/** Worker-pool prerender: N workers drain a shared cursor (Atomics), each writing
 *  its own HTML. Rejects on any worker failure so prerenderPages can fall back. */
async function prerenderPagesPool(ctx: PrerenderCtx, n: number): Promise<PrerenderResult> {
  const { Worker } = await import("node:worker_threads");
  // Worker location. Dev: run the `.ts` next to us (import.meta.url is this file's
  // real path). Binary: the worker is embedded as a compile ENTRYPOINT at its source
  // path under bunfs, but prerenderPool is INLINED into the main entry — so our
  // import.meta.url is the binary's, and a relative URL would miss. Reference the
  // worker by its known bunfs path instead. A wrong path just triggers the serial
  // fallback below (byte-identical), so this stays safe across bun changes.
  const workerUrl: string | URL = ctx.isBin
    ? "/$bunfs/root/xyd-documan/src/bun/prerenderWorker.js"
    : new URL("./prerenderWorker.ts", import.meta.url);

  const cursorSAB = new SharedArrayBuffer(4);
  new Int32Array(cursorSAB)[0] = 0;
  console.error(`[build] prerender pool: ${n} workers`);

  const workers: any[] = [];
  const results: PrerenderResult[] = [];
  let aborted = false;
  const killAll = () => { for (const w of workers) { try { w.terminate(); } catch {} } };

  try {
    await new Promise<void>((resolveAll, rejectAll) => {
      let done = 0;
      const fail = (e: any) => { if (!aborted) { aborted = true; killAll(); rejectAll(e instanceof Error ? e : new Error(String(e))); } };
      const finishOne = () => { if (++done === n && !aborted) resolveAll(); };

      for (let id = 0; id < n; id++) {
        const input: WorkerInput = {
          cwd: ctx.cwd, host: ctx.host, isBin: ctx.isBin, argv2: ctx.argv2,
          buildAssets: ctx.buildAssets, clientDir: ctx.clientDir,
          serverBundlePath: ctx.serverBundlePath, cursorSAB,
          slugs: ctx.slugs, accessMap: ctx.accessMap, dataPlane: ctx.dataPlane,
        };
        const w = new Worker(workerUrl, { workerData: input });
        workers.push(w);
        let settled = false;
        w.on("message", (m: any) => {
          if (m?.type === "result") { settled = true; results.push({ ok: m.ok, missing: m.missing || [] }); try { w.terminate(); } catch {} finishOne(); }
          else if (m?.type === "error") { settled = true; fail(new Error(m.reason || "worker error")); }
          // "ready" → ignore
        });
        w.on("error", (e: any) => { if (!settled) { settled = true; fail(e); } });
        w.on("exit", (code: number) => { if (!settled) { settled = true; fail(new Error(`worker exited (${code}) before result`)); } });
      }
    });
  } finally {
    killAll();
  }

  let ok = 0;
  const missing: string[] = [];
  for (const r of results) { ok += r.ok; missing.push(...r.missing); }
  missing.sort(); // deterministic ordering regardless of which worker found what
  return { ok, missing };
}

/** Entry point buildStatic calls. Chooses pool vs serial; any pool failure (e.g. a
 *  worker that can't load native) degrades gracefully to the serial loop — writes
 *  are idempotent overwrites, so a partial pool run is safely re-done. */
export async function prerenderPages(ctx: PrerenderCtx): Promise<PrerenderResult> {
  const n = decideConcurrency(ctx.slugs.length);
  if (n <= 1) return prerenderPagesSerial(ctx);
  try {
    return await prerenderPagesPool(ctx, n);
  } catch (e: any) {
    console.error(`[build] prerender pool failed (${e?.message || e}); falling back to serial`);
    return prerenderPagesSerial(ctx);
  }
}
