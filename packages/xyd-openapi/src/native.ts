// Loader for the Rust core (S6+ W2). Resolution order:
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
    if (embedded?.oapSchemaToReferencesFromFile) return embedded;
    let mod: any = null;
    try {
        const require = createRequire(import.meta.url);
        mod = require("@xyd-js/native");
    } catch {
        mod = null;
    }
    // See the note in @xyd-js/gql's loader: XYD_REQUIRE_NATIVE=1 makes a failed
    // load fatal, so a "native" CI leg can't silently be a second JS run.
    if (process.env.XYD_REQUIRE_NATIVE === "1" && typeof mod?.oapSchemaToReferencesFromFile !== "function") {
        throw new Error("XYD_REQUIRE_NATIVE=1 but @xyd-js/native.oapSchemaToReferencesFromFile is unavailable");
    }
    return mod;
}

export const native = load();

/// Non-enumerable stash on docs returned by deferencedOpenAPI — the native path
/// re-derefs+converts from the SOURCE (path or spec text) in Rust, while the JS
/// cyclic doc keeps serving the examples post-pass + __UNSAFE_selector.
export const NATIVE_SOURCE = Symbol.for("xyd.openapi.nativeSource");
