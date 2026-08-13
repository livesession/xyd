// Native syntax-highlight dispatch (H5). Routes the build-time highlight() call
// through @xyd-js/native (crates/xyd_highlight) when the addon is present —
// byte-identical to codehike/code (H4-proven) — and falls back to codehike when
// it is absent or XYD_NATIVE=0 (loader in ./native).
import { highlight as codehikeHighlight } from "codehike/code";
import type { HighlightedCode } from "codehike/code";

import { native } from "./native";

// Keep the signature identical to codehike's highlight() so call sites only
// swap their import.
export async function highlight(
    codeblock: Parameters<typeof codehikeHighlight>[0],
    theme: Parameters<typeof codehikeHighlight>[1]
): Promise<HighlightedCode> {
    if (native?.highlight) {
        const result: HighlightedCode = JSON.parse(
            native.highlight(
                codeblock.value,
                codeblock.lang || "",
                codeblock.meta || "",
                JSON.stringify(theme)
            )
        );
        // codehike echoes the input `meta` verbatim (null/undefined stays as-is);
        // the napi boundary needs a string, so pass `|| ""` for the call but
        // restore the original meta so the result is byte-identical to codehike.
        result.meta = codeblock.meta;
        return result;
    }
    return codehikeHighlight(codeblock, theme);
}
