# apps/docs bench — old (Vite+JS) vs new (Bun+Rust)

A reusable, committed harness that compares the two xyd architectures on a real site
(`apps/docs`) across three axes the migration must not regress: **backward-compatibility**,
**speed**, and **memory**.

## The matrix (`configs.mjs`)

Two orthogonal, env-selectable axes in the CLI:

| config | engine (`XYD_BUN`) | natives (`XYD_NATIVE`) | role |
|---|---|---|---|
| `vite-js`   | Vite + React Router (unset) | JS (`0`)   | **OLD** baseline |
| `vite-rust` | Vite (unset)                | Rust (`1`) | isolate: natives under Vite |
| `bun-js`    | Bun engine (`1`)            | JS (`0`)   | isolate: engine only |
| `bun-rust`  | Bun engine (`1`)            | Rust (`1`) | **NEW** |
| `binary`    | `bun --compile` artifact    | Rust       | **SHIP** (opt-in, `BENCH_BINARY=1`) |

The 2×2 lets us attribute any delta to the *engine* swap, the *natives* swap, or both.

## What it measures

- **Cold build**: wall time (`/usr/bin/time -l` real) + peak RSS, N-iteration median.
- **Output**: page count (HTML files, plus the Bun SSG `wrote X/Y` line) + bundle size (total / js / css / html).
- **Backward-compat** (`COMPAT_PAIRS`): each pair isolates ONE question —
  - same-engine pairs (`vite-rust`↔`vite-js`, `bun-rust`↔`bun-js`) → **`structural`**: full DOM-normalized HTML must match (proves the Rust natives don't alter output);
  - cross-engine pairs (`bun-*`↔`vite-js`) → **`content`**: shell-agnostic user-visible **text + heading/link sets** must match (the two engines emit different bootstrap shells by construction, so a raw HTML diff there is noise).

## Run

```bash
node __tests__/perf/bench.mjs                    # N=1, the 4 CLI configs
BENCH_N=3 node __tests__/perf/bench.mjs          # 3 iterations → medians (slower)
BENCH_ONLY=bun-rust,vite-js node …/bench.mjs     # a subset
BENCH_BINARY=1 node …/bench.mjs                  # also the compiled binary (next-increment)
```

Prereq: `pnpm build` (the harness runs the local monorepo CLI at
`packages/xyd-cli/dist/index.js` with `XYD_DEV_MODE=1`). Outputs land in
`__tests__/perf/target/` (gitignored): `results.json`, `report.md`, per-config
`out/<id>/` build trees, and `<id>.build.log`.

## Next increment (not yet wired)

- **Dev-server startup + HMR latency** (reuse `__tests__/e2e/utils/xyd-server.ts` + a
  content-edit → recompile timer).
- **Visual diff** (Playwright screenshots per route, pixel delta) — complements the
  structural/content diff.
- **`binary` config** — build via `packages/xyd-cli/scripts/compile.ts`, then run it as the
  server for its build/startup numbers.
- **HTML report + Artifact** (bar charts) generated from `results.json`.
