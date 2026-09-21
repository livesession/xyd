// Loader for the Rust core (S6+ W4). navigation.ts is server-only (it statically
// imports node:fs and @mdx-js/mdx) so a Node builtin here is safe — but we still
// use the bundler-invisible getBuiltinModule pattern for consistency with the
// other shims and the bun --compile binary. Resolution order:
//   1. XYD_NATIVE=0 → null (force the JS MDX path — test/incident hatch)
//   2. globalThis.__xydNativeCore — the embedded core.node inside the binary
//   3. @xyd-js/native — the napi package
//   4. null → getFrontmatter falls back to the MDX compile

function load(): any | null {
    if (typeof process === "undefined" || !process.versions) return null;
    if (process.env?.XYD_NATIVE === "0") return null;
    const embedded = (globalThis as any).__xydNativeCore;
    if (embedded?.frontmatterBatch) return embedded;
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
    if (process.env?.XYD_REQUIRE_NATIVE === "1" && typeof mod?.frontmatterBatch !== "function") {
        throw new Error("XYD_REQUIRE_NATIVE=1 but @xyd-js/native.frontmatterBatch is unavailable");
    }
    return mod;
}

export const native = load();
