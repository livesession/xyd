import type { Segment, SegmentAppearance } from "@xyd-js/core";

/**
 * `Segment.appearance` accepts a string (`"sidebarDropdown"`) or an object
 * (`{ kind: "sidebarDropdown", options: { fixed: true } }`). These helpers
 * normalize both forms so every appearance reader compares kinds (and reads
 * kind-specific options) uniformly.
 */
export function segmentAppearanceKind(segment?: Segment | null): SegmentAppearance | undefined {
    const a = segment?.appearance
    if (!a) return undefined
    return typeof a === "string" ? a : a.kind
}

/** Kind-specific options of the object form; `{}` for the string form / none. */
export function segmentAppearanceOptions<T extends Record<string, any> = Record<string, any>>(
    segment?: Segment | null,
): T {
    const a = segment?.appearance
    if (a && typeof a === "object") {
        return (((a as any).options) || {}) as T
    }
    return {} as T
}
