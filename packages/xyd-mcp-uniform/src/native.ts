// Loader for the Rust core (S6+ W3 rider). Same bundler-invisible pattern as
// @xyd-js/uniform's loader (no static node:module import — see that file's
// header): browser → null; XYD_NATIVE=0 hatch → __xydNativeCore (compiled
// binary) → @xyd-js/native → null (frozen JS impl).

function load(): any | null {
    if (typeof process === "undefined" || !process.versions) return null;
    if (process.env?.XYD_NATIVE === "0") return null;
    const embedded = (globalThis as any).__xydNativeCore;
    if (embedded?.mcpToReferences) return embedded;
    try {
        const nodeModule = (process as any).getBuiltinModule?.("node:module");
        const require = nodeModule?.createRequire?.(import.meta.url);
        return require?.("@xyd-js/native") ?? null;
    } catch {
        return null;
    }
}

export const native = load();
