// Loader for the Rust native highlighter (H5). Bundler-invisible
// getBuiltinModule pattern (xyd-composer is server-only, but the binary +
// browser-safety rule still apply). Resolution order:
//   1. browser / no process → null
//   2. XYD_NATIVE=0 → null (force the codehike path — test/incident hatch)
//   3. globalThis.__xydNativeCore — the embedded core.node inside the binary
//   4. @xyd-js/native — the napi package
//   5. null → the highlight shim falls back to codehike/code

function load(): any | null {
    if (typeof process === "undefined" || !process.versions) return null;
    if (process.env?.XYD_NATIVE === "0") return null;
    const embedded = (globalThis as any).__xydNativeCore;
    if (embedded?.highlight) return embedded;
    let mod: any = null;
    try {
        const nodeModule = (process as any).getBuiltinModule?.("node:module");
        const require = nodeModule?.createRequire?.(import.meta.url);
        mod = require?.("@xyd-js/native") ?? null;
    } catch {
        mod = null;
    }
    // See the note in @xyd-js/gql's loader: XYD_REQUIRE_NATIVE=1 makes a failed
    // load fatal, so a "native" CI leg can't silently be a second JS run.
    if (process.env?.XYD_REQUIRE_NATIVE === "1" && typeof mod?.highlight !== "function") {
        throw new Error("XYD_REQUIRE_NATIVE=1 but @xyd-js/native.highlight is unavailable");
    }
    return mod;
}

export const native = load();
