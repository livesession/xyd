# Client WASM highlighter — feasibility spike + implementation

Goal: let xyd's **client-side** (browser) re-highlight path use xyd's own Rust
highlighter (`crates/xyd_highlight`) instead of codehike / `@code-hike/lighter`,
behind a **config toggle** so both engines can coexist (old sites = codehike,
new Rust-based sites = rust). Server-side is already Rust (napi
`packages/xyd-native/src/highlight.rs`); the gap is the browser re-highlight
(theme switching / dynamic code), which needs the highlighter as **WASM**.

---

## STEP 0 — Feasibility verdict

**GO — via route (a): keep the pure-Rust engine in WASM, delegate the regex
primitive to `onig.wasm` (vscode-oniguruma) through a JS binding.**

**NO-GO — for the naive route (compile `crates/xyd_highlight` as-is to wasm).**
`onig_sys` bundles the Oniguruma **C** library and cannot link on a wasm target
without a C sysroot.

### What was actually tried (real commands, real errors)

Toolchain present on this machine: `rustc 1.92.0`, targets
`wasm32-unknown-unknown` + `wasm32-wasip1`, `wasm-pack`, `wasm-bindgen`.
No `emcc`, no WASI SDK (`/opt/wasi-sdk` absent, `WASI_SDK_PATH` unset).

1. `cargo check -p xyd_highlight` (native, aarch64) → **OK** (onig 6.5.3,
   onig_sys 69.9.3). Baseline good.

2. `cargo build -p xyd_highlight --target wasm32-unknown-unknown` → **FAIL** in
   the `onig_sys` build script:

   ```
   cargo:warning=oniguruma/src/regint.h:123:10: fatal error: 'stdlib.h' file not found
   error occurred in cc-rs: command did not execute successfully:
     clang ... --target=wasm32-unknown-unknown ... -c oniguruma/src/regexec.c
   ```

   `wasm32-unknown-unknown` has **no libc / no C headers**. `cc-rs` invokes the
   host `clang` with no sysroot → `stdlib.h` not found. Hard blocker.

3. `cargo build -p xyd_highlight --target wasm32-wasip1` → **FAIL**, identical
   `stdlib.h` not found. `wasm32-wasip1` *does* define a libc, but the stock
   `clang` still needs a **WASI sysroot** (wasi-sdk) to find the headers, and
   none is installed. Even with wasi-sdk this route is undesirable: (i) a WASI
   module needs a WASI shim in the browser (not a `wasm-bindgen` ESM), and (ii)
   a *separately-built* Oniguruma would have to be re-proven byte-identical to
   the server's `onig_sys` build — extra risk for no upside.

### Why route (a) is the right one (and preserves byte-parity)

`onig` is used in **exactly one file** — `crates/xyd_highlight/src/onig_scanner.rs`
(`grep -rn 'onig::' src` → 1 hit). Everything else (grammar, rule compiler,
tokenizer, theme, reshape, registry, zstd store) is **pure Rust** over
`ruzstd` + `indexmap` + `serde_json`, all of which compile to wasm. The
tokenizer consumes only the abstract `crate::OnigScanner` via two methods:

```
OnigScanner::new(&sources)            // compile N TextMate patterns
scanner.find_next_match(text, start)  // -> ScanMatch { pattern_index, captures }
```

So we swap the **backend of that one primitive**:

- **native / napi build** (default feature `native-onig`): the existing
  `onig`-crate scanner, untouched → server output unchanged.
- **wasm build** (feature `js-scanner`, `--no-default-features`): the scanner
  delegates `new`/`find` to a host-provided backend. The WASM crate registers a
  backend that calls JS, and the JS drives **`onig.wasm`** — the *same*
  Oniguruma build that `@code-hike/lighter` / vscode-textmate already use, and
  that `onig_sys` is compiled from. Same engine ⇒ same match semantics ⇒
  byte-parity is preserved *by construction*, not re-implemented.

The Rust scanner already documents that it operates on **UTF-8 byte offsets**
(`onig_scanner.rs`). The JS binding must therefore drive `onig.wasm` at the
UTF-8-byte level (encode the line to UTF-8, pass byte offsets), NOT via
vscode-oniguruma's high-level `OnigScanner` JS wrapper which maps UTF-16↔UTF-8.
See the binding notes below.

### Cost / constraints (honest)

- **Binary size.** `build.rs` bakes all 254 grammars (zstd, ~4.5 MB compressed)
  + themes into the crate via `include_bytes!`. In wasm that's ~4.5 MB inside
  the `.wasm` (plus the ruzstd decoder + engine). Mitigations, in order of
  preference: enable the existing `core-langs` feature (top-20 languages +
  their embed closure) to shrink drastically; or move to **external/lazy asset
  loading** (fetch a grammar bundle on first use) — a follow-up. `onig.wasm`
  itself is ~0.5 MB, loaded once on the JS side and shared.
- **Async init.** The `.wasm` (engine) + `onig.wasm` must be instantiated before
  the first highlight. The client shim lazy-inits and, until ready (or on any
  failure), falls back to codehike — so there's never a hard dependency.
- **Not verifiable end-to-end in this session.** `node_modules` is not installed
  in this worktree, so `vscode-oniguruma`'s `onig.wasm` is not present and the
  JS↔wasm path can't be executed here. What IS proven in-session (see below) is
  the entire Rust side: the swapped-backend engine reproduces the committed
  codehike goldens **byte-for-byte** when the backend is wired to Oniguruma.
  The one remaining check (JS marshaling of UTF-8 offsets to `onig.wasm`) is
  documented with a runnable harness.

---

## What was built

### 1. Scanner backend seam in `crates/xyd_highlight` (non-breaking)

- `onig` became an **optional** dependency; features:
  - `default = ["native-onig"]` → the napi/native path keeps Oniguruma exactly
    as before (the napi crate depends on `xyd_highlight` with default features).
  - `js-scanner` → the delegated backend (no `onig`, no wasm-bindgen in the pure
    crate — just a registered `ScannerBackend` trait object).
  - a `compile_error!` guards "exactly one backend".
- `src/onig_scanner.rs` split into `native-onig` and `js-scanner` backends behind
  `cfg`, sharing the public `ScanMatch`/`CaptureSpan` types and the exact
  `OnigScanner::new`/`find_next_match` API. The `js-scanner` backend exposes
  `register_scanner_backend(Box<dyn ScannerBackend>)`.
- **Runnable parity proof** (`tests/js_scanner_seam.rs`, gated on `js-scanner`):
  registers an Oniguruma-backed `ScannerBackend` (via `onig` as a **dev**-dep)
  and asserts `highlighted_code(...)` equals the committed
  `tests/goldens-codehike/*.json` byte-for-byte. This exercises the *entire*
  delegated seam natively and shows it is behavior-preserving. The existing
  default-feature parity tests are untouched and still pass.

### 2. `crates/xyd_highlight_wasm` (new wasm-bindgen crate)

- Depends on `xyd_highlight` with `default-features = false, features =
  ["js-scanner"]`; compiles to `wasm32-unknown-unknown`.
- Exposes the same surface as the napi binding:
  `highlight(value, lang, meta, themeJson) -> HighlightedCode JSON` and
  `getThemeColors(themeJson)`.
- Registers a `ScannerBackend` that calls JS-imported functions
  (`__xyd_onig_new` / `__xyd_onig_find` / `__xyd_onig_free`) supplied by
  `js/onig-binding.js`, which drives `onig.wasm`.
- **Excluded** from the `crates/` workspace (like the napi crate) so a normal
  host `cargo build`/`test`/`clippy` at the workspace root never tries to link a
  wasm-only cdylib; it is built/linted explicitly for the wasm target.

### 3. Client config toggle + dispatch shim in `packages/xyd-components`

- `src/coder/highlightEngine.ts` — a small config surface holding the active
  engine (`"codehike"` default | `"rust"`), settable via
  `configureCoder({ highlighter })` or the `globalThis.__xydCoderHighlighter`
  global (so the docs-engine can set it from `settings.engine.highlighter`
  without `xyd-components` importing core).
- `src/coder/highlightDispatch.ts` — mirrors the SERVER shim
  (`xyd-content`/`xyd-composer`): when the engine is `"rust"` and the WASM module
  loads, it calls the Rust-WASM `highlight`; otherwise it uses codehike. Any
  error or unavailability falls back to codehike, so the default path is
  byte-for-byte unchanged.
- The browser re-highlight choke points (`CodeTheme.tsx` `fetchHighlight` /
  `prewarmHighlight`) route through the dispatch shim.

### Config toggle (documented surface)

```jsonc
// docs.json
{ "engine": { "highlighter": "rust" } }   // default: "codehike"
```

The docs-engine reads `settings.engine.highlighter` and calls
`configureCoder({ highlighter })` (or sets `globalThis.__xydCoderHighlighter`)
during app init. That one wiring line lives in the docs-engine/framework
(out of this change's file scope) and is the only remaining integration step for
the toggle to be user-facing; the `xyd-components` surface it calls is complete.

---

## Measured results (this session)

| Check | Result |
|-------|--------|
| `cargo build -p xyd_highlight --target wasm32-unknown-unknown` (as-is, native onig) | **FAIL** — `onig_sys` C: `stdlib.h` not found (no sysroot) |
| `--target wasm32-wasip1` (as-is) | **FAIL** — same (no WASI sysroot installed) |
| `xyd_highlight` default (`native-onig`) tests | **PASS** — 42 unit + goldens parity + snapshot (napi path unchanged) |
| `xyd_highlight` `js-scanner` seam parity test (js/ts/json/bash × 2 themes) | **PASS** — delegated engine == codehike goldens, byte-for-byte |
| `xyd_highlight` `js-scanner` lib → `wasm32-unknown-unknown` | **PASS** — pure engine compiles to wasm |
| `xyd_highlight_wasm` → `wasm32-unknown-unknown` (debug / release) | **PASS** — 13 MB debug / **2.6 MB release** (`core-langs`, pre-`wasm-opt`, pre-gzip) |
| `wasm-pack build --target web` | **PASS** — glue imports `js/onig-binding.js`, exports `highlight`/`getThemeColors` (napi-matching) |
| `cargo clippy` (default + `js-scanner`), `cargo fmt` | **clean** |
| Client TS (`highlightEngine`/`highlightDispatch` + wired call sites) | syntax-validated (full `tsc` needs `node_modules`) |

## Remaining verification (needs `node_modules` + `onig.wasm`)

1. `pnpm i` so `vscode-oniguruma`'s `onig.wasm` is available.
2. Build the wasm: `wasm-pack build crates/xyd_highlight_wasm --target web`
   (or `--target bundler`), enabling `core-langs` to keep size sane.
3. Run `crates/xyd_highlight_wasm/js/verify-parity.mjs` (Node harness): loads
   `onig.wasm` + the built engine wasm, highlights the same corpus as
   `tests/goldens-codehike/*.json`, and diffs against the server napi output.
   Expectation: **byte-equal** (same Oniguruma, same reshape).
