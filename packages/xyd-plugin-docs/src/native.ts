// Loader for the Rust settings data plane (S6+ W6). Bundler-invisible
// getBuiltinModule pattern (plugin-docs index.ts is server-only, but the
// binary + browser-safety rule still apply). XYD_NATIVE=0 hatch →
// __xydNativeCore (compiled binary) → @xyd-js/native → null.

function load(): any | null {
    if (typeof process === "undefined" || !process.versions) return null;
    if (process.env?.XYD_NATIVE === "0") return null;
    const embedded = (globalThis as any).__xydNativeCore;
    if (embedded?.mapNavigationToPagePathMapping) return embedded;
    try {
        const nodeModule = (process as any).getBuiltinModule?.("node:module");
        const require = nodeModule?.createRequire?.(import.meta.url);
        return require?.("@xyd-js/native") ?? null;
    } catch {
        return null;
    }
}

export const settingsNative = load();
