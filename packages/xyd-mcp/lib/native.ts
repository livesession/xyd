// Loader for the Rust native highlighter (H5). Bundler-invisible
// getBuiltinModule pattern (xyd-mcp is server-only; keeps @xyd-js/native out of
// the bun bundle). Resolution order:
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
    try {
        const nodeModule = (process as any).getBuiltinModule?.("node:module");
        const require = nodeModule?.createRequire?.(import.meta.url);
        return require?.("@xyd-js/native") ?? null;
    } catch {
        return null;
    }
}

export const native = load();
