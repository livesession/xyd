// Loader for the Rust core (S6+ W7 wiring). Resolution order:
//   1. XYD_NATIVE=0 → null (force the frozen JS impl)
//   2. globalThis.__xydNativeCore — the embedded core.node inside the binary
//   3. @xyd-js/native — the napi package
//   4. null → the shim falls back to the JS generator
import { createRequire } from "node:module";

function load(): any | null {
  if (process.env.XYD_NATIVE === "0") return null;
  const embedded = (globalThis as any).__xydNativeCore;
  if (embedded?.opencli2rust) return embedded;
  try {
    const require = createRequire(import.meta.url);
    return require("@xyd-js/native");
  } catch {
    return null;
  }
}

export const native = load();
