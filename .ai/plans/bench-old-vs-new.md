# Bench harness: old (Vite+JS) vs new (Bun+Rust) xyd on apps/docs

Goal: a **reusable, committed** harness that runs `apps/docs` through the architecture matrix
and compares **backward-compatibility**, **performance**, and **speed** — old vs new, with
attribution (engine vs natives) and the real ship target (the compiled binary).

## The config matrix (5)

Both axes are env-selectable (grounded in `packages/xyd-cli/src/commands/{build,dev}.ts` +
`native-boot.ts`): `XYD_BUN` picks the engine (unset=Vite, `1`=Bun), `XYD_NATIVE` picks the
converters/highlighter/content-compiler (`0`=JS, `1`=Rust).

| id | engine | natives | invocation | role |
|----|--------|---------|-----------|------|
| `vite-js`   | Vite | JS   | `XYD_NATIVE=0 xyd …`               | **OLD baseline** |
| `vite-rust` | Vite | Rust | `XYD_NATIVE=1 xyd …`               | isolates the natives' contribution |
| `bun-js`    | Bun  | JS   | `XYD_BUN=1 XYD_NATIVE=0 xyd …`     | isolates the engine's contribution |
| `bun-rust`  | Bun  | Rust | `XYD_BUN=1 XYD_NATIVE=1 xyd …`     | **NEW** (non-binary) |
| `binary`    | Bun/Rust compiled | Rust (embedded) | the `bun --compile` binary's `build`/`dev` | **SHIP target** |

Attribution: `vite-js→vite-rust` = natives; `vite-js→bun-js` = engine; `→bun-rust` = combined;
`binary` = distribution reality (node-free).

## Metrics (per config)

**Speed (wall-clock, median of N runs, warm-up discarded):**
- Cold build: clean `.xyd/` → `xyd build`.
- Warm/incremental build: rebuild with caches.
- Dev startup: spawn `xyd dev` → poll `/` until HTTP 200.
- HMR latency: edit a content `.md` → time to the reload signal (common observable: a Playwright
  page reload listener — works for both Vite HMR and the Bun livereload ws).
- Per-page SSG time: if instrumentable via `ENABLE_TIMERS` / build-log parse (best-effort).

**Performance (resources):**
- Peak RSS during build (`/usr/bin/time -l` on darwin; process-tree sampling as fallback).
- CPU time (user+sys).
- Dev server steady-state RSS (sample after startup settles).
- Output size: total `.xyd/build/client/` + JS/CSS/HTML breakdown.
- Binary size (for `binary`).

**Backward-compatibility (correctness), all vs the `vite-js` baseline:**
- **Structural** — per-route DOM-normalized HTML diff. Reuse the mdx-parity `normalizeHtml`
  (attr-order-insensitive) + strip hashed asset filenames/inline nonces. Report identical / first-diff.
- **Route/SEO parity** — same route set, and normalized `sitemap.xml` / `robots.txt` / `llms.txt`.
- **Visual** — Playwright screenshots per route (served via `xyd serve` / a static server per
  config), pixel-diff (pixelmatch) vs baseline → mismatch %.
- **Runtime health** — dev-serve each config, load the pages via Playwright: assert 0 console
  errors, 0 hydration mismatches, 0 failed requests.

## Harness layout (committed, reusable)

```
__tests__/perf/
├── README.md              # how to run + interpret; machine caveats
├── bench.mjs              # orchestrator: for each config → build/dev metrics → compat → collect
├── configs.mjs           # the 5 configs (env + how each is invoked; binary build hook)
├── metrics/
│   ├── time-mem.mjs       # spawn + wall-time + peak RSS + CPU
│   ├── dev-startup.mjs    # spawn dev, poll to first 200
│   ├── hmr.mjs            # edit a fixture .md, measure edit→reload via Playwright
│   └── output-size.mjs    # client dir + per-asset sizes
├── compat/
│   ├── html-diff.mjs      # DOM-normalized per-route HTML diff (reuse mdx-parity normalize)
│   ├── route-parity.mjs   # route set + sitemap/robots/llms.txt parity
│   └── visual-diff.mjs    # Playwright screenshot pixel-diff
├── report/
│   ├── collect.mjs        # aggregate → results.json
│   └── render.mjs         # results.json → report.md + a self-contained Artifact HTML (bar charts + compat grid)
└── target/                # (gitignored) per-config outputs, screenshots, results.json
```

Reuses: `__tests__/e2e/utils/xyd-server.ts` (XydServer dev/build spin-up, already supports both
modes), the mdx-parity DOM normalizer, Playwright (`playwright.config.ts`).

## Methodology / rigor
- N=5 iterations per timing metric, report median + min/max; discard a warm-up run.
- Clean `.xyd/` between cold builds; keep pnpm/cargo caches warm + consistent.
- Same `apps/docs` tree + same commit for all configs; single machine (local darwin) — report the
  machine + note CI-portability as a follow-up.
- Build the `binary` once up front (`packages/xyd-cli/scripts/compile.ts`).
- Everything env-driven so a CI lane can run a subset later.

## Deliverable
- `__tests__/perf/target/results.json` (raw) + `report.md` (tables: speed / memory / size / compat
  deltas + engine-vs-natives attribution) + a **published Artifact** (HTML: bar charts for
  build-time/memory/size across the 5 configs, and a per-route compat pass/fail grid).

## Phased execution (after approval)
0. **Smoke** — confirm each of the 5 configs can build **and** dev-serve `apps/docs` at all;
   record any that fail as first-class findings (a config that can't build is itself a result).
   This de-risks before building the full harness.
1. Harness skeleton — `configs.mjs`, `bench.mjs`, `metrics/*` (build + dev + memory).
2. Compat — structural + route/SEO + visual + runtime-health.
3. Report — `collect` → `report.md` → Artifact.
4. **Run it** end-to-end → produce the comparison report.

## Known risks (surface, don't hide)
- **A config may not build apps/docs yet.** The migration is capability-gated with JS fallback, so
  `bun-rust`/`binary` on a real 83-page site may hit an unported path → falls back (correctness OK)
  or errors (finding). Phase 0 flushes this out first.
- **HMR observable differs** (Vite HMR vs Bun livereload) → use the page-reload event as the common
  signal; note the mechanism per engine.
- **macOS memory sampling** — `/usr/bin/time -l` gives peak RSS for the build process; dev
  steady-state via `ps` sampling of the process tree.
- **Binary build is heavy** (compile.ts) and `binary` degrades some features (orama search, npm:
  themes) — the report notes these as caveats, not failures.
- **Single-machine numbers** — medians reduce noise but this is a relative comparison on one host,
  not an absolute benchmark; CI-normalized runs are a follow-up.
