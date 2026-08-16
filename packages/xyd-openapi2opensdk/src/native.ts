// Loader for the Rust core (S6+ W2 rider). Resolution order:
//   1. XYD_NATIVE=0 → null (force the frozen JS impl — test/incident hatch
//      while src/impl-js exists)
//   2. globalThis.__xydNativeCore — the embedded core.node inside the
//      bun-compiled binary (set by xyd-cli's native-boot)
//   3. @xyd-js/native — the napi package (platform .node via optionalDependencies)
//   4. null → the shim falls back to src/impl-js
import { createRequire } from "node:module";

function load(): any | null {
  if (process.env.XYD_NATIVE === "0") return null;
  const embedded = (globalThis as any).__xydNativeCore;
  if (embedded?.openapi2opensdk) return embedded;
  try {
    const require = createRequire(import.meta.url);
    return require("@xyd-js/native");
  } catch {
    return null;
  }
}

export const native = load();
