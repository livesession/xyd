// Client highlighter toggle — lets an xyd site run its OWN Rust (WASM) syntax
// highlighter on the client re-highlight path (theme switching / dynamic code)
// instead of codehike, while keeping codehike the default so existing sites are
// unaffected.
//
// This module is the low-level CONFIG SURFACE only. `@xyd-js/components` never
// depends on the WASM package (it is built + loaded separately); instead the
// docs-engine/host INJECTS a Rust highlight function here once it has loaded the
// WASM (see `setRustHighlighter`). The actual dispatch lives in
// `./highlightDispatch`. See `.ai/client-wasm-highlighter-spike.md`.

/** Which engine the client re-highlight path uses. `codehike` is the default. */
export type HighlighterName = "codehike" | "rust";

/**
 * A Rust highlighter function — the SAME surface as the napi/WASM
 * `highlight(value, lang, meta, themeJson)` binding: returns the codehike
 * `HighlightedCode` as a JSON string. `themeJson` is the JSON-stringified
 * `settings.theme.coder.syntaxHighlight` (a bundled theme name OR a resolved VS
 * Code theme object — both handled by the Rust engine).
 */
export type RustHighlightFn = (
    value: string,
    lang: string,
    meta: string,
    themeJson: string,
) => string;

interface CoderConfig {
    highlighter?: HighlighterName;
    rustHighlight?: RustHighlightFn;
}

const config: CoderConfig = {};

/**
 * Configure the coder highlighter. Typically called by the docs-engine from
 * `settings.engine.highlighter`. Partial — only the provided keys change.
 */
export function configureCoder(patch: CoderConfig): void {
    if (patch.highlighter !== undefined) config.highlighter = patch.highlighter;
    if (patch.rustHighlight !== undefined) config.rustHighlight = patch.rustHighlight;
}

/**
 * Register the Rust (WASM) highlight function. The host calls this after it has
 * built + instantiated the WASM highlighter and loaded onig.wasm. Passing
 * `null` clears it (falls back to codehike).
 */
export function setRustHighlighter(fn: RustHighlightFn | null): void {
    config.rustHighlight = fn ?? undefined;
}

/**
 * The active highlighter. Resolution: explicit `configureCoder` wins, then the
 * `globalThis.__xydCoderHighlighter` global (so the engine can set it before the
 * bundle loads, without importing this package), then the `codehike` default.
 */
export function getHighlighterName(): HighlighterName {
    if (config.highlighter) return config.highlighter;
    const g = (globalThis as { __xydCoderHighlighter?: unknown }).__xydCoderHighlighter;
    if (g === "rust" || g === "codehike") return g;
    return "codehike";
}

/**
 * The registered Rust highlight function, or `null` if none. Falls back to a
 * `globalThis.__xydRustHighlight` global so the host can inject without importing
 * this package.
 */
export function getRustHighlighter(): RustHighlightFn | null {
    if (config.rustHighlight) return config.rustHighlight;
    const g = (globalThis as { __xydRustHighlight?: unknown }).__xydRustHighlight;
    return typeof g === "function" ? (g as RustHighlightFn) : null;
}

/**
 * Whether the Rust engine should actually be used right now — the toggle is on
 * AND a Rust highlighter is registered. When the toggle is on but nothing is
 * registered yet, callers fall back to codehike (safe default), so a
 * misconfigured or still-loading site never breaks.
 */
export function isRustHighlighterActive(): boolean {
    return getHighlighterName() === "rust" && getRustHighlighter() !== null;
}
