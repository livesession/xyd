// Native syntax-highlight dispatch (H5). The build-time highlight() call sites
// route through @xyd-js/native (crates/xyd_highlight) when the addon is present
// — byte-identical to codehike/code (H4-proven across 54 cells) — and fall back
// to codehike when it is absent or XYD_NATIVE=0 (loader in ./native).
import { highlight as codehikeHighlight } from "codehike/code";
import type { HighlightedCode } from "codehike/code";

import { native } from "./native";

let warnedNativeHighlight = false;
function warnNativeHighlightFailed(e: unknown) {
    if (warnedNativeHighlight) return;
    warnedNativeHighlight = true;
    console.warn(
        `[highlight] native highlighter failed, falling back to codehike: ${(e as any)?.message || e}`
    );
}

// Keep the signature identical to codehike's highlight() so call sites only
// swap their import.
export async function highlight(
    codeblock: Parameters<typeof codehikeHighlight>[0],
    theme: Parameters<typeof codehikeHighlight>[1]
): Promise<HighlightedCode> {
    if (native?.highlight) {
        try {
            const result: HighlightedCode = JSON.parse(
                native.highlight(
                    codeblock.value ?? "",
                    codeblock.lang || "",
                    codeblock.meta || "",
                    // The napi boundary needs a string; an unresolved theme (undefined)
                    // must not become `JSON.stringify(undefined) === undefined` and crash.
                    JSON.stringify(theme ?? "github-dark")
                )
            );
            // codehike echoes the input `meta` verbatim (a null/undefined meta stays
            // null/undefined). We pass `|| ""` for the call but restore the original
            // meta so the result is byte-identical to codehike (parity gate).
            result.meta = codeblock.meta;
            return result;
        } catch (e) {
            // A native highlight failure must never break the build — fall back to
            // codehike (the proven path). Warn once so the cause is visible.
            warnNativeHighlightFailed(e);
        }
    }
    return codehikeHighlight(codeblock, theme);
}
