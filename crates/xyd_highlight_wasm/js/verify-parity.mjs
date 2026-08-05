// End-to-end byte-parity harness for the client WASM highlighter.
//
// Runs the ACTUAL browser path in Node — the wasm-pack build + onig.wasm via
// js/onig-binding.js — over the committed codehike goldens and diffs against the
// server's expected `HighlightedCode`. This is the acceptance test the Rust seam
// test (crates/xyd_highlight/tests/js_scanner_seam.rs) stands in for when
// node_modules / onig.wasm are unavailable. See
// `.ai/client-wasm-highlighter-spike.md`.
//
// Prereqs:
//   1. `pnpm i` at the repo root (so `vscode-oniguruma` + its onig.wasm exist).
//   2. `wasm-pack build --target nodejs --out-dir pkg-node crates/xyd_highlight_wasm`
//      (nodejs target so this script can `import` it directly).
//      NOTE: build WITHOUT `--no-default-features` to keep `core-langs`, or with
//      `--no-default-features` to embed all 254 grammars.
//
// Run:  node crates/xyd_highlight_wasm/js/verify-parity.mjs
//
// Exit code 0 = every cell byte-identical; 1 = at least one mismatch.

import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const GOLDENS_DIR = join(
  __dirname,
  "..",
  "..",
  "xyd_highlight",
  "tests",
  "goldens-codehike",
);

async function main() {
  // 1. Load onig.wasm through our binding (same module the Rust wasm imports).
  const { loadOnig } = await import("./onig-binding.js");
  const onigWasmPath = require.resolve("vscode-oniguruma/release/onig.wasm");
  await loadOnig(readFileSync(onigWasmPath).buffer);

  // 2. Load the wasm-pack (nodejs target) build.
  const wasm = await import("../pkg-node/xyd_highlight_wasm.js");
  const highlight = wasm.highlight;

  // 3. Diff every golden cell.
  const files = readdirSync(GOLDENS_DIR).filter((f) => f.endsWith(".json"));
  let checked = 0;
  const failures = [];

  for (const file of files) {
    const golden = JSON.parse(readFileSync(join(GOLDENS_DIR, file), "utf8"));
    const { value, alias, meta, themes } = golden;
    for (const [theme, expected] of Object.entries(themes)) {
      checked++;
      const got = JSON.parse(highlight(value, alias, meta, theme));
      const a = JSON.stringify(got);
      const b = JSON.stringify(expected);
      if (a !== b) {
        failures.push(`${file} x ${theme} (alias=${alias})`);
      }
    }
  }

  if (failures.length) {
    console.error(
      `WASM parity FAILED: ${failures.length}/${checked} cells differ:\n  ` +
        failures.join("\n  "),
    );
    process.exit(1);
  }
  console.log(`WASM parity OK: ${checked}/${checked} cells byte-identical.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
