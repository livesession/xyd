// Native getThemeColors dispatch (H5). Routes the build-time getThemeColors()
// call through @xyd-js/native (crates/xyd_highlight) when the addon is present
// and falls back to @code-hike/lighter when it is absent or XYD_NATIVE=0. Reuses
// the existing settingsNative loader (src/native.ts) — the embedded core carries
// every export, so its getThemeColors is available whichever branch resolved it.
import { getThemeColors as lighterGetThemeColors } from "@code-hike/lighter";

import { settingsNative as native } from "../../native";

// Keep the signature identical to @code-hike/lighter's getThemeColors() (already
// async at the call site) so it only swaps its import.
export async function getThemeColors(
    theme: Parameters<typeof lighterGetThemeColors>[0]
): Promise<Awaited<ReturnType<typeof lighterGetThemeColors>>> {
    if (native?.getThemeColors) {
        return JSON.parse(native.getThemeColors(JSON.stringify(theme)));
    }
    return lighterGetThemeColors(theme);
}
