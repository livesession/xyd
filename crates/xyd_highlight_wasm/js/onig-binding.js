// onig.wasm bridge for xyd_highlight_wasm.
//
// The Rust WASM engine (built with the `js-scanner` feature) delegates the
// TextMate regex primitive to THIS module, which drives `vscode-oniguruma`'s
// onig.wasm — the SAME Oniguruma build `@code-hike/lighter` / vscode-textmate
// ship. Same engine ⇒ identical match semantics ⇒ the client tokens are
// byte-identical to the napi server highlighter. See
// `.ai/client-wasm-highlighter-spike.md`.
//
// The three `xydOnig*` exports are what wasm-bindgen imports (see the
// `#[wasm_bindgen(module = "/js/onig-binding.js")]` block in src/lib.rs).
// `loadOnig()` is the app-facing init that must resolve BEFORE the first
// highlight() call.
//
// OFFSET CONTRACT — the make-or-break detail. The Rust engine works in **UTF-8
// byte offsets**: `xydOnigFind` receives a UTF-8 byte `start` and MUST return
// UTF-8 byte capture spans. vscode-oniguruma's `findNextMatchSync` speaks
// **UTF-16** (JS string units). So we convert start UTF-8→UTF-16 going in, and
// every capture UTF-16→UTF-8 coming out. Because oniguruma itself operates on
// the UTF-8 encoding internally, this recovers exactly the byte offsets the
// native onig_sys path yields — byte-parity, multibyte included.

import { loadWASM, OnigScanner } from "vscode-oniguruma";

let ready = false;
const scanners = new Map(); // handle -> OnigScanner
let nextHandle = 1;

/**
 * Load onig.wasm. Call once, await it, THEN instantiate the Rust wasm and
 * highlight. Accepts anything vscode-oniguruma's loadWASM accepts:
 *   - browser: a `Response` / `Promise<Response>` (e.g. `fetch(onigWasmUrl)`)
 *   - node:    an `ArrayBuffer` / `Uint8Array` of the onig.wasm bytes
 */
export async function loadOnig(wasmInput) {
  if (ready) return;
  await loadWASM(wasmInput);
  ready = true;
}

/** Whether onig.wasm has been loaded. */
export function onigReady() {
  return ready;
}

// --- the three primitives wasm-bindgen imports -----------------------------

/** patternsJson: JSON array of pattern strings → numeric scanner handle. */
export function xydOnigCompile(patternsJson) {
  if (!ready) {
    throw new Error(
      "[xyd_highlight_wasm] onig.wasm not loaded — await loadOnig(...) before highlighting",
    );
  }
  const patterns = JSON.parse(patternsJson);
  const handle = nextHandle++;
  // vscode-oniguruma logs + inerts patterns it can't compile, matching the
  // native backend's "bad regex is inert" behavior.
  scanners.set(handle, new OnigScanner(patterns));
  return handle;
}

/**
 * Earliest match at/after the UTF-8 byte offset `start`.
 * Returns a JSON string: "null" for no match, else
 * `[patternIndex, g0Beg, g0End, g1Beg, g1End, …]` in UTF-8 byte offsets
 * (-1 for a non-participating group).
 */
export function xydOnigFind(handle, text, start) {
  const scanner = scanners.get(handle);
  if (!scanner) return "null";

  const map = offsetTables(text);
  const utf16Start = u8ToU16(map, start);
  const m = scanner.findNextMatchSync(text, utf16Start);
  if (!m) return "null";

  const out = [m.index];
  for (const cap of m.captureIndices) {
    // Non-participating group → -1 (mirrors Oniguruma region beg == -1, which
    // the native Rust backend maps to `None`).
    if (cap.start < 0 || cap.end < 0) {
      out.push(-1, -1);
    } else {
      out.push(map.u16ToU8[cap.start], map.u16ToU8[cap.end]);
    }
  }
  return JSON.stringify(out);
}

/** Release a scanner handle. */
export function xydOnigFree(handle) {
  scanners.delete(handle);
}

// --- UTF-8 <-> UTF-16 offset conversion ------------------------------------

// One-entry cache: the tokenizer calls find() many times with the SAME line
// string (increasing `start`), so recomputing the table each call would be
// O(n^2)/line. Caching by string identity makes it O(n)/line.
let cacheText = null;
let cacheMap = null;

/**
 * Build `u16ToU8[k] = byteLength(text.slice(0, k))` over UTF-16 units.
 * Non-decreasing, length `text.length + 1`. Also the total byte length.
 */
function offsetTables(text) {
  if (text === cacheText) return cacheMap;
  const n = text.length;
  const u16ToU8 = new Int32Array(n + 1);
  let bytes = 0;
  let k = 0;
  while (k < n) {
    u16ToU8[k] = bytes;
    const cp = text.codePointAt(k);
    const units = cp > 0xffff ? 2 : 1;
    const b = cp <= 0x7f ? 1 : cp <= 0x7ff ? 2 : cp <= 0xffff ? 3 : 4;
    if (units === 2) u16ToU8[k + 1] = bytes; // mid-surrogate: never queried at a boundary
    bytes += b;
    k += units;
  }
  u16ToU8[n] = bytes;
  cacheText = text;
  cacheMap = { u16ToU8, totalBytes: bytes };
  return cacheMap;
}

/** UTF-8 byte offset → UTF-16 unit offset (binary search on the byte prefix). */
function u8ToU16(map, byteOffset) {
  const arr = map.u16ToU8;
  if (byteOffset <= 0) return 0;
  if (byteOffset >= map.totalBytes) return arr.length - 1;
  let lo = 0;
  let hi = arr.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < byteOffset) lo = mid + 1;
    else hi = mid;
  }
  return lo; // arr[lo] === byteOffset at a char boundary (engine always is)
}
