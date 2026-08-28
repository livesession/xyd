import { Segment } from "@xyd-js/core";

import { useSettings } from "../contexts";

/**
 * The (first) segment declaring `appearance: "logoTrailing"`.
 *
 * Unlike `sidebarDropdown` (which is route-scoped), a logoTrailing switcher is
 * GLOBAL — a top-level product switcher rendered after the logo on EVERY page,
 * so it is found straight from settings, NOT gated by the current route. The
 * active product is derived from the current path in `FwSegmentLogoTrailing`
 * (no product active → the trigger falls back to the segment `title`).
 */
export function useLogoTrailingSegment(): Segment | null {
    const settings = useSettings()

    return settings.navigation?.segments?.find(
        segment => segment.appearance === "logoTrailing"
    ) || null
}
