import * as fsNode from "node:fs";
import { createRequire } from "node:module";

/**
 * Dev file-watcher for the Bun render server (plan S5). Prefers the Rust
 * watcher (`@xyd-js/native::createWatcher` — already classifies, de-dups and
 * debounces). Falls back to node `fs.watch` + a JS mirror of the classifier
 * when the native `.node` is absent (fresh clone / non-darwin-arm64 / no Rust
 * toolchain) — this fallback is load-bearing, not defensive polish: it's what
 * lets `XYD_BUN=1 xyd dev` work before `pnpm --filter @xyd-js/native build:native`.
 *
 * The kind→action switch lives entirely in `rebuild` (startDevServer); this
 * module only classifies + coalesces and hands (kind, paths) off.
 */

export interface WatchHandle {
  stop(): void;
}

const IGNORE_DIRS = ["node_modules", ".xyd", ".git", "dist", "target", ".cache"];

type Rebuild = (kind: string, paths: string[]) => Promise<void>;

export function startWatcher(cwd: string, rebuild: Rebuild): WatchHandle {
  // Coalesce a save-burst into one rebuild per kind (the native watcher already
  // debounces; fs.watch does not, so this guards both paths).
  let pending: Record<string, string[]> = {};
  let timer: any;
  const flush = () => {
    const batch = pending;
    pending = {};
    for (const kind of Object.keys(batch)) rebuild(kind, batch[kind]).catch((e) => console.error("[watch] rebuild", e));
  };
  const enqueue = (kind: string, p: string) => {
    (pending[kind] ??= []).push(p);
    clearTimeout(timer);
    timer = setTimeout(flush, 60);
  };

  const require = createRequire(import.meta.url);

  // Preferred: the Rust watcher.
  try {
    const { createWatcher } = require("@xyd-js/native");
    const w = createWatcher(
      cwd,
      { debounceMs: 40, ignoreDirs: IGNORE_DIRS },
      (err: Error | null, batch: Array<{ kind: string; path: string }>) => {
        if (err) {
          console.error("[watch]", err);
          return;
        }
        for (const { kind, path } of batch) enqueue(kind, path);
      }
    );
    console.error("[watch] using @xyd-js/native (Rust)");
    return { stop: () => w.stop() };
  } catch (e) {
    console.error("[watch] @xyd-js/native unavailable, falling back to fs.watch:", (e as any)?.message);
  }

  // Fallback: node fs.watch + classify (native standalone fn if loadable, else JS mirror).
  const classify = safeClassify(require);
  const w = fsNode.watch(cwd, { recursive: true }, (_ev, filename) => {
    if (!filename) return;
    const p = String(filename);
    const segs = p.split(/[\\/]/);
    if (segs.some((s) => IGNORE_DIRS.includes(s))) return;
    enqueue(classify(p), p);
  });
  console.error("[watch] using node fs.watch (fallback)");
  return { stop: () => w.close() };
}

function safeClassify(require: NodeRequire): (p: string) => string {
  try {
    const { classify } = require("@xyd-js/native");
    if (typeof classify === "function") return (p: string) => classify(p);
  } catch {}
  return jsClassify;
}

/**
 * JS mirror of `xyd_core_rs::classify` (precedence-exact). Only used when the
 * whole native addon fails to load; keep in lockstep with the Rust kernel.
 */
function jsClassify(p: string): string {
  const full = p.toLowerCase();
  const segs = full.split(/[\\/]/);
  const name = segs[segs.length - 1] || "";
  if (name === "docs.json" || name === "docs.ts" || name === "docs.tsx") return "settings";
  if (name.startsWith(".env")) return "env";
  if (full.endsWith(".md") || full.endsWith(".mdx")) return "content";
  if (full.endsWith(".yaml") || full.endsWith(".yml") || full.endsWith(".json")) return "api";
  if (full.endsWith(".svg") || segs.includes("icons")) return "icon";
  if (segs.includes("public")) return "public";
  return "other";
}
