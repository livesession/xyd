#!/usr/bin/env node
// Bench harness: old (Vite+JS) vs new (Bun+Rust) xyd on apps/docs.
//
// Measures, per config, the COLD-BUILD dimension (wall time + peak RSS + output
// size + page count), preserves each config's build output, and runs a
// STRUCTURAL backward-compat diff (DOM-normalized per-route HTML) against the
// baseline. Emits target/results.json + target/report.md.
//
//   node __tests__/perf/bench.mjs                 # default: N=1, the 4 CLI configs
//   BENCH_N=3 node __tests__/perf/bench.mjs       # 3 iterations (median), slower
//   BENCH_BINARY=1 node __tests__/perf/bench.mjs  # also build + measure the compiled binary
//   BENCH_ONLY=bun-rust,vite-js node …            # subset of configs
//
// Dev-server startup, HMR latency, and visual (screenshot) diff are the next
// increment — see README.md.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, readdirSync, statSync, cpSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIGS, BASELINE, BASE_ENV, COMPAT_PAIRS } from "./configs.mjs";
import { normalizeHtml } from "../../packages/xyd-content/__fixtures__/mdx-parity/_harness/render.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..", "..");
const APP = join(REPO, "apps", "docs");
const CLI = join(REPO, "packages", "xyd-cli", "dist", "index.js");
const TARGET = join(__dirname, "target");
const N = Number(process.env.BENCH_N || 1);
const ONLY = process.env.BENCH_ONLY ? new Set(process.env.BENCH_ONLY.split(",")) : null;

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const mb = (bytes) => Math.round(bytes / 1048576);

// --- output helpers ---------------------------------------------------------
function listHtml(dir) {
  const out = [];
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".html")) out.push(p);
  } };
  if (existsSync(dir)) walk(dir);
  return out;
}
function dirSize(dir) {
  let bytes = 0, js = 0, css = 0, html = 0;
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    const s = statSync(p).size; bytes += s;
    if (e.name.endsWith(".js")) js += s;
    else if (e.name.endsWith(".css")) css += s;
    else if (e.name.endsWith(".html")) html += s;
  } };
  if (existsSync(dir)) walk(dir);
  return { total: bytes, js, css, html };
}

// --- one cold build, timed via /usr/bin/time -l -----------------------------
function coldBuild(cfg) {
  const clientDir = join(APP, ".xyd", "build", "client");
  rmSync(join(APP, ".xyd", "build"), { recursive: true, force: true });
  const logPath = join(TARGET, `${cfg.id}.build.log`);
  const envStr = Object.entries({ ...BASE_ENV, ...cfg.env })
    .map(([k, v]) => `${k}=${v}`).join(" ");
  const inner = `env ${envStr} node "${CLI}" build > "${logPath}" 2>&1`;
  const started = Date.now();
  const r = spawnSync("/usr/bin/time", ["-l", "sh", "-c", inner], { cwd: APP, encoding: "utf8" });
  const wallNode = (Date.now() - started) / 1000;
  // /usr/bin/time -l stats land on OUR stderr (build output went to the log).
  const stats = r.stderr || "";
  const real = Number((stats.match(/([\d.]+)\s+real/) || [])[1]) || wallNode;
  const rss = Number((stats.match(/(\d+)\s+maximum resident set size/) || [])[1]) || 0;
  return { ok: r.status === 0, exit: r.status, wall: real, peakRss: rss, clientDir, logPath };
}

// --- run each config (N iterations; preserve last output) -------------------
function benchConfig(cfg) {
  if (cfg.binary && !process.env.BENCH_BINARY) return { ...cfg, skipped: "BENCH_BINARY not set" };
  if (cfg.binary) return { ...cfg, skipped: "binary bench not wired yet (see README next-steps)" };
  const walls = [], rsss = [];
  let last = null;
  for (let i = 0; i < N; i++) { last = coldBuild(cfg); walls.push(last.wall); rsss.push(last.peakRss); }
  const preserved = join(TARGET, "out", cfg.id);
  rmSync(preserved, { recursive: true, force: true });
  if (existsSync(last.clientDir)) cpSync(last.clientDir, preserved, { recursive: true });
  const pages = listHtml(preserved).length;
  const size = dirSize(preserved);
  // parse the bun SSG "wrote X/Y pages" line if present (X may be < Y on partial)
  const log = existsSync(last.logPath) ? readFileSync(last.logPath, "utf8").replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "") : "";
  const wrote = (log.match(/wrote (\d+)\/(\d+) pages/) || []);
  return {
    id: cfg.id, role: cfg.role, engine: cfg.engine, natives: cfg.natives,
    ok: last.ok, exit: last.exit,
    wallSec: Number(median(walls).toFixed(1)), wallRuns: walls.map(w => Number(w.toFixed(1))),
    peakRssMB: mb(median(rsss)),
    pagesHtml: pages, wrote: wrote[1] ? { ok: +wrote[1], total: +wrote[2] } : null,
    sizeMB: mb(size.total), sizeBreakdown: { jsMB: mb(size.js), cssMB: mb(size.css), htmlMB: mb(size.html) },
    preserved,
  };
}

// --- compat modes -----------------------------------------------------------
function stripHashes(html) {
  // neutralize content-hashed asset filenames so only real structural drift counts.
  return html
    .replace(/-[A-Za-z0-9_]{8,}\.(js|css|woff2?|png|jpg|svg)/g, "-HASH.$1")
    .replace(/\/assets\/[A-Za-z0-9_-]+\.(js|css)/g, "/assets/HASH.$1");
}
// structural: full DOM-normalized HTML (same-engine pairs only — cross-engine
// shells differ by construction).
function structural(html) { return normalizeHtml(stripHashes(html)); }
// content: user-visible text + heading/link sets, shell-agnostic (cross-engine).
// Strips <head>, <script>, <style>, all tags → collapsed text; plus the ordered
// list of heading texts and internal link hrefs (the load-bearing content signal).
function content(html) {
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, html])[1];
  const noScript = body.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  const headings = [...noScript.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)].map(m => text(m[1]));
  const links = [...noScript.matchAll(/<a[^>]*href="([^"]*)"/gi)].map(m => m[1]).filter(h => h && !h.startsWith("http"));
  return { text: text(noScript), headings, links: [...new Set(links)].sort() };
}
function text(html) { return html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim(); }
function firstDiff(a, b) {
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const lo = Math.max(0, i - 30);
  return { at: i, base: a.slice(lo, i + 50), cfg: b.slice(lo, i + 50) };
}
// Run one compat pair (cfg vs base) in the given mode.
function compatPair(pair, byId) {
  const baseDir = byId[pair.base]?.preserved, cfgDir = byId[pair.cfg]?.preserved;
  if (!baseDir || !cfgDir || !existsSync(baseDir) || !existsSync(cfgDir)) return null;
  const routes = new Map(); for (const p of listHtml(baseDir)) routes.set(relative(baseDir, p), p);
  const cfgRoutes = new Map(); for (const p of listHtml(cfgDir)) cfgRoutes.set(relative(cfgDir, p), p);
  let identical = 0; const differing = []; const missing = []; const extra = [];
  for (const [rel, basePath] of routes) {
    const cfgPath = cfgRoutes.get(rel);
    if (!cfgPath) { missing.push(rel); continue; }
    const bh = readFileSync(basePath, "utf8"), ch = readFileSync(cfgPath, "utf8");
    if (pair.mode === "structural") {
      const b = structural(bh), c = structural(ch);
      if (b === c) identical++; else differing.push({ route: rel, ...firstDiff(b, c) });
    } else {
      const b = content(bh), c = content(ch);
      const same = b.text === c.text && JSON.stringify(b.headings) === JSON.stringify(c.headings) && JSON.stringify(b.links) === JSON.stringify(c.links);
      if (same) identical++;
      else differing.push({ route: rel, ...firstDiff(b.text, c.text),
        headingsDelta: b.headings.length === c.headings.length ? null : `${b.headings.length}→${c.headings.length}`,
        linksDelta: b.links.length === c.links.length ? null : `${b.links.length}→${c.links.length}` });
    }
  }
  for (const rel of cfgRoutes.keys()) if (!routes.has(rel)) extra.push(rel);
  return { ...pair, total: routes.size, identical, differing, missing, extra };
}

// --- main -------------------------------------------------------------------
function main() {
  mkdirSync(TARGET, { recursive: true });
  const configs = CONFIGS.filter(c => !ONLY || ONLY.has(c.id));
  console.log(`bench: apps/docs · N=${N} · configs=[${configs.map(c => c.id).join(", ")}]`);
  const results = [];
  for (const cfg of configs) {
    process.stdout.write(`  building ${cfg.id} … `);
    const r = benchConfig(cfg);
    if (r.skipped) { console.log(`skipped (${r.skipped})`); results.push(r); continue; }
    console.log(`exit=${r.exit} wall=${r.wallSec}s rss=${r.peakRssMB}MB pages=${r.pagesHtml}${r.wrote && r.wrote.ok < r.wrote.total ? ` (wrote ${r.wrote.ok}/${r.wrote.total}!)` : ""} size=${r.sizeMB}MB`);
    results.push(r);
  }
  // compat — per pair (each isolates one question), skip pairs whose configs
  // weren't run in this invocation.
  const byId = Object.fromEntries(results.map(r => [r.id, r]));
  const compatReport = [];
  for (const pair of COMPAT_PAIRS) {
    if (!byId[pair.cfg] || !byId[pair.base]) continue;
    const cr = compatPair(pair, byId);
    if (!cr) continue;
    compatReport.push(cr);
    console.log(`  compat ${pair.cfg} vs ${pair.base} [${pair.mode}]: ${cr.identical}/${cr.total} identical · ${cr.differing.length} differ · ${cr.missing.length} missing · ${cr.extra.length} extra`);
  }
  const out = { app: "apps/docs", n: N, baseline: BASELINE, when: new Date().toISOString?.() || "n/a", results, compat: compatReport };
  writeFileSync(join(TARGET, "results.json"), JSON.stringify(out, null, 2));
  writeFileSync(join(TARGET, "report.md"), renderMd(out));
  console.log(`\nwrote ${join(TARGET, "results.json")} + report.md`);
}

function renderMd(o) {
  const base = o.results.find(r => r.id === o.baseline);
  const speedup = (r) => base?.wallSec && r.wallSec ? `${(base.wallSec / r.wallSec).toFixed(2)}×` : "—";
  let md = `# apps/docs bench — old (Vite+JS) vs new (Bun+Rust)\n\n`;
  md += `Baseline: **${o.baseline}** · N=${o.n} (median) · single host.\n\n`;
  md += `## Build speed / memory / size\n\n`;
  md += `| config | role | exit | cold build | vs baseline | peak RSS | pages | output size |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;
  for (const r of o.results) {
    if (r.skipped) { md += `| ${r.id} | ${r.role} | — | _skipped_ | — | — | — | — |\n`; continue; }
    const pg = r.wrote && r.wrote.ok < r.wrote.total ? `${r.pagesHtml} ⚠️(${r.wrote.ok}/${r.wrote.total})` : `${r.pagesHtml}`;
    md += `| ${r.id} | ${r.role} | ${r.exit} | ${r.wallSec}s | ${r.id === o.baseline ? "—" : speedup(r)} | ${r.peakRssMB}MB | ${pg} | ${r.sizeMB}MB |\n`;
  }
  md += `\n## Backward-compat\n\nEach row isolates one question. Same-engine pairs use full DOM-normalized HTML (\`structural\`); cross-engine pairs use shell-agnostic user-visible content — text + heading/link sets (\`content\`), because Vite and Bun emit different bootstrap shells by construction.\n\n`;
  md += `| pair | mode | identical / total | differ | missing | extra | asks |\n|---|---|---|---|---|---|---|\n`;
  for (const c of o.compat) {
    md += `| ${c.cfg} vs ${c.base} | ${c.mode} | ${c.identical}/${c.total} | ${c.differing.length} | ${c.missing.length} | ${c.extra.length} | ${c.asks} |\n`;
  }
  for (const c of o.compat) {
    if (!c.differing.length && !c.missing.length) continue;
    md += `\n### ${c.cfg} vs ${c.base} [${c.mode}] deltas\n`;
    for (const d of c.differing.slice(0, 8)) {
      const extra = [d.headingsDelta && `headings ${d.headingsDelta}`, d.linksDelta && `links ${d.linksDelta}`].filter(Boolean).join(", ");
      md += `- \`${d.route}\`${extra ? ` (${extra})` : ""} @${d.at}\n  - base: \`${(d.base || "").replace(/\n/g, "⏎")}\`\n  - cfg: \`${(d.cfg || "").replace(/\n/g, "⏎")}\`\n`;
    }
    if (c.missing.length) md += `- missing routes: ${c.missing.slice(0, 10).join(", ")}${c.missing.length > 10 ? " …" : ""}\n`;
  }
  md += `\n> Speed/memory are relative, single-host medians. Dev-startup, HMR, visual-diff, and the compiled \`binary\` config are the next increment (README).\n`;
  return md;
}

main();
