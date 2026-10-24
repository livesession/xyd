import type { APIFile, APIFileOptions } from "./types/settings";
import { entriesOf, isAdvanced, sourceMatches } from "./api-sdk";

// ---------------------------------------------------------------------------
// Per-source rendering options (`api.<kind>[..].options`).
//
// BROWSER-SAFE, like the sdk resolver it borrows the entry matching from: the
// build-side callers pass the VERBATIM config source, the per-page conversion
// an ABSOLUTE spec path.
// ---------------------------------------------------------------------------

/**
 * The `options` of the `api.<kind>` entry that declares `source` (the config
 * string as written, or the absolute path of that file), or null when no
 * entry matches or the matching entry has none.
 */
export function resolveApiFileOptions(
    api: APIFile | undefined,
    source: string,
): APIFileOptions | null {
    if (!source) return null;
    for (const entry of entriesOf(api)) {
        if (!isAdvanced(entry)) continue;
        if (!sourceMatches(entry.source, source)) continue;
        return entry.options ?? null;
    }
    return null;
}
