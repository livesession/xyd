import type { APIFile, APIFileAdvanced, APIFileOptions } from "@xyd-js/core";

// ---------------------------------------------------------------------------
// Per-source rendering options (`api.<kind>[..].options`).
//
// Build-side only: the uniform processor (the per-page conversion, an ABSOLUTE
// spec path) and the plugin-docs presets (the sidebar build, the VERBATIM config
// source) read the options of the entry that declares a spec. The matching
// mirrors the sdk resolver in @xyd-js/core (exact equality first, then a
// normalized suffix match) so both resolvers pick the same entry for a source.
//
// It lives HERE, not next to that resolver, on purpose: the compiled binary's
// server bundle resolves every `@xyd-js/*` import from the workspace root, where
// a published build of @xyd-js/core (a dev dependency of one workspace member)
// shadows the workspace package — a core export added in the same change is
// invisible to that compile. @xyd-js/content has no such twin, and every
// consumer of this helper already depends on it.
// ---------------------------------------------------------------------------

function isAdvanced(entry: unknown): entry is APIFileAdvanced {
    return !!entry && typeof entry === "object" && typeof (entry as any).source === "string";
}

/** Every entry of an APIFile across all its shapes (string / mixed array / map / advanced). */
function entriesOf(api: APIFile | undefined): Array<string | APIFileAdvanced> {
    if (!api) return [];
    if (typeof api === "string") return [api];
    if (Array.isArray(api)) return api as Array<string | APIFileAdvanced>;
    if (isAdvanced(api)) return [api];
    // APIFileMap
    return Object.values(api as Record<string, string | APIFileAdvanced>);
}

const isRemote = (s: string) => s.startsWith("http://") || s.startsWith("https://");

/** "\\"→"/", strip leading "./" and "../" segments — the comparable tail of a config source. */
function sourceTail(source: string): string {
    let s = source.replace(/\\/g, "/");
    while (s.startsWith("./") || s.startsWith("../")) {
        s = s.startsWith("./") ? s.slice(2) : s.slice(3);
    }
    return s;
}

/**
 * Whether `source` (the VERBATIM config string or an ABSOLUTE spec path) refers
 * to `entry`'s spec. Remote URLs match by exact equality only. For local paths
 * the absolute form matches when it ends with the config source's normalized
 * tail. First matching entry wins (documented ambiguity for twin tails).
 */
function sourceMatches(entrySource: string, source: string): boolean {
    if (entrySource === source) return true;
    if (isRemote(entrySource) || isRemote(source)) return false;

    const tail = sourceTail(entrySource);
    if (!tail) return false;
    const abs = source.replace(/\\/g, "/");
    return abs === tail || abs.endsWith("/" + tail);
}

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
