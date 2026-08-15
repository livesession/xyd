// The architecture matrix compared by the bench harness. Two orthogonal axes,
// both env-selectable in the CLI (packages/xyd-cli/src/commands/{build,dev}.ts):
//   XYD_BUN   — engine:   unset = Vite + React Router (old), "1" = Bun engine (new)
//   XYD_NATIVE— natives:  "0" = JS converters/highlighter/mdx, "1" = Rust (@xyd-js/native)
//
// The `binary` config is the bun --compile artifact (Rust/Bun-only, node-free) — the
// real ship target; it is built on demand and skipped unless BENCH_BINARY=1.
export const CONFIGS = [
  { id: "vite-js",   engine: "vite",   natives: "js",   env: { XYD_NATIVE: "0" },                 role: "OLD baseline" },
  { id: "vite-rust", engine: "vite",   natives: "rust", env: { XYD_NATIVE: "1" },                 role: "isolate: natives" },
  { id: "bun-js",    engine: "bun",    natives: "js",   env: { XYD_BUN: "1", XYD_NATIVE: "0" },   role: "isolate: engine" },
  { id: "bun-rust",  engine: "bun",    natives: "rust", env: { XYD_BUN: "1", XYD_NATIVE: "1" },   role: "NEW" },
  { id: "binary",    engine: "binary", natives: "rust", env: {},                                  role: "SHIP", binary: true },
];

export const BASELINE = "vite-js";

// Backward-compat comparisons — each pair isolates ONE question. Cross-engine
// (vite↔bun) HTML shells differ by construction (different bootstrap markup), so
// those pairs use "content" mode (user-visible text + heading/link sets, shell-
// agnostic); same-engine pairs use "structural" mode (full DOM-normalized HTML)
// which is the clean signal that the Rust natives don't alter output.
export const COMPAT_PAIRS = [
  { cfg: "vite-rust", base: "vite-js", mode: "structural", asks: "Rust natives don't change Vite output" },
  { cfg: "bun-js",    base: "vite-js", mode: "content",    asks: "Bun engine renders the same content as Vite (both JS natives)" },
  { cfg: "bun-rust",  base: "bun-js",  mode: "structural", asks: "Rust natives don't change Bun output" },
  { cfg: "bun-rust",  base: "vite-js", mode: "content",    asks: "NEW (Bun+Rust) vs OLD (Vite+JS) — full content parity" },
];

// Env applied to every run (dev-mode = use the local monorepo build).
export const BASE_ENV = { XYD_DEV_MODE: "1", XYD_NODE_PM: "pnpm" };
