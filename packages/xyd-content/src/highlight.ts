// Native syntax-highlight dispatch (H5). The build-time highlight() call sites
// route through @xyd-js/native (crates/xyd_highlight) when the addon is present
// — byte-identical to codehike/code (H4-proven across 54 cells) — and fall back
// to codehike when it is absent or XYD_NATIVE=0 (loader in ./native).
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
        return JSON.parse(
            native.highlight(
                codeblock.value,
                codeblock.lang,
                codeblock.meta || "",
                JSON.stringify(theme)
            )
        );
    }
    return codehikeHighlight(codeblock, theme);
}
