// Loader for the Rust core (S6+ W1). Resolution order:
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
    if (embedded?.gqlSchemaToReferences) return embedded;
    let mod: any = null;
    try {
        const require = createRequire(import.meta.url);
        mod = require("@xyd-js/native");
    } catch {
        mod = null;
    }
    // XYD_REQUIRE_NATIVE=1 turns a failed load into a HARD failure instead of a
    // silent downgrade to impl-js. Without it the two CI legs are
    // indistinguishable: hiding the .node and running `XYD_NATIVE=1 vitest run`
    // here reported "14 passed", byte-identical to the real native run — i.e. a
    // native leg that never touched the native code would still be green. Assert
    // the SYMBOL, not just the module, so "loaded but missing an export" (a
    // dropped #[napi] fn) fails here too rather than at the `native?.fn` call site.
    if (process.env.XYD_REQUIRE_NATIVE === "1" && typeof mod?.gqlSchemaToReferences !== "function") {
        throw new Error("XYD_REQUIRE_NATIVE=1 but @xyd-js/native.gqlSchemaToReferences is unavailable");
    }
    return mod;
}

export const native = load();
