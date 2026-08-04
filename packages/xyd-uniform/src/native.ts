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
    try {
        const nodeModule = (process as any).getBuiltinModule?.("node:module");
        const require = nodeModule?.createRequire?.(import.meta.url);
        return require?.("@xyd-js/native") ?? null;
    } catch {
        return null;
    }
}

export const native = load();
