// Client highlight DISPATCH — the browser counterpart to the server shim in
// `xyd-content`/`xyd-composer` (`native?.highlight` else codehike). When the
// coder toggle is `rust` AND a Rust (WASM) highlighter is registered, code is
// highlighted by xyd's OWN engine — byte-identical to the napi server path;
// otherwise codehike runs, unchanged. Any error falls back to codehike, so the
// default path is never at risk. See `.ai/client-wasm-highlighter-spike.md`.
import { highlight as codehikeHighlight } from "codehike/code";
import type { HighlightedCode } from "codehike/code";

import { getRustHighlighter, isRustHighlighterActive } from "./highlightEngine";

// Keep the signature identical to codehike's highlight() so call sites only swap
// their import — exactly like the server shim.
type Codeblock = Parameters<typeof codehikeHighlight>[0];
type ThemeArg = Parameters<typeof codehikeHighlight>[1];

function rustHighlight(codeblock: Codeblock, theme: ThemeArg): HighlightedCode | null {
    const rust = getRustHighlighter();
    if (!rust) return null;
    try {
        const json = rust(
            codeblock.value,
            codeblock.lang || "",
            codeblock.meta || "",
            JSON.stringify(theme),
        );
        return JSON.parse(json) as HighlightedCode;
    } catch (e) {
        if (typeof console !== "undefined") {
            console.warn("[xyd] rust highlighter failed; falling back to codehike", e);
        }
        return null;
    }
}

/**
 * Async highlight — the drop-in replacement for `codehike/code`'s `highlight`,
 * used by the browser re-highlight path (theme switching / dynamic code). Routes
 * to the Rust WASM engine when active, else codehike.
 */
export async function highlight(
    codeblock: Codeblock,
    theme: ThemeArg,
): Promise<HighlightedCode> {
    if (isRustHighlighterActive()) {
        const hc = rustHighlight(codeblock, theme);
        if (hc) return hc;
    }
    return codehikeHighlight(codeblock, theme);
}

/**
 * Synchronous Rust fast-path for the sync call sites (`Code/highlight.ts`,
 * `hooks/highlight.ts`). Returns the Rust `HighlightedCode` when the toggle is on
 * and a highlighter is registered (WASM `highlight` is sync once loaded), else
 * `null` so the caller keeps its existing synchronous codehike/lighter path.
 */
export function highlightRustSyncOrNull(
    codeblock: Codeblock,
    theme: ThemeArg,
): HighlightedCode | null {
    if (!isRustHighlighterActive()) return null;
    return rustHighlight(codeblock, theme);
}
