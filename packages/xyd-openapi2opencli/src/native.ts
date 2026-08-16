// Loader for the Rust core (S6+ W7). Resolution order:
//   1. XYD_NATIVE=0 → null (force the frozen JS impl)
//   2. globalThis.__xydNativeCore — the embedded core.node inside the binary
//   3. @xyd-js/native — the napi package
//   4. null → the shim falls back to src/impl-js
import { createRequire } from "node:module";

function load(): any | null {
  if (process.env.XYD_NATIVE === "0") return null;
  const embedded = (globalThis as any).__xydNativeCore;
  if (embedded?.openapi2opencliFromFile) return embedded;
  try {
    const require = createRequire(import.meta.url);
    return require("@xyd-js/native");
  } catch {
    return null;
  }
}

export const native = load();

// The openapi shim's deferencedOpenAPI stashes the SOURCE path on the returned
// doc under this global-registry symbol; the native path re-reads + derefs from
// that file (the deref'd doc itself is cyclic and can't be JSON-marshalled).
export const NATIVE_SOURCE = Symbol.for("xyd.openapi.nativeSource");
