// Loader for the Rust core (S6+ W3). @xyd-js/uniform is ISOMORPHIC — this
// module is part of the browser bundle — so it must not statically import any
// Node builtin (a bare `import {createRequire} from "node:module"` breaks
// browser builds). `process.getBuiltinModule` (Node >= 22.3 — xyd's floor is
// 22.12 — and Bun) reaches node:module without a bundler-visible import.
//
// Resolution order:
//   1. Browser (no process) → null (JS impls)
//   2. XYD_NATIVE=0 → null (test/incident hatch while src/impl-js exists)
//   3. globalThis.__xydNativeCore — the embedded core.node inside the
//      bun-compiled binary (set by xyd-cli's native-boot)
//   4. @xyd-js/native — the napi package (platform .node)
//   5. null → the dispatchers fall back to src/impl-js

function load(): any | null {
    if (typeof process === "undefined" || !process.versions) return null;
    if (process.env?.XYD_NATIVE === "0") return null;
    const embedded = (globalThis as any).__xydNativeCore;
    if (embedded?.pluginNavigation) return embedded;
    let mod: any = null;
    try {
        const nodeModule = (process as any).getBuiltinModule?.("node:module");
        const require = nodeModule?.createRequire?.(import.meta.url);
        mod = require?.("@xyd-js/native") ?? null;
    } catch {
        mod = null;
    }
    // See the note in @xyd-js/gql's loader: XYD_REQUIRE_NATIVE=1 makes a failed
    // load fatal, so a "native" CI leg can't silently be a second JS run. Note
    // the `require?.(...)` above also yields null WITHOUT throwing when
    // getBuiltinModule is unavailable, so the catch alone could never have
    // caught it — the guard has to be here, after the try.
    if (process.env?.XYD_REQUIRE_NATIVE === "1" && typeof mod?.pluginNavigation !== "function") {
        throw new Error("XYD_REQUIRE_NATIVE=1 but @xyd-js/native.pluginNavigation is unavailable");
    }
    return mod;
}

export const native = load();
