import type { APIFile, APIFileAdvanced, APISdkConfig, APISdkLanguage } from "./types/settings";

// ---------------------------------------------------------------------------
// SDK-native API docs config resolution (`api.openapi[..].sdk`).
//
// BROWSER-SAFE — no node imports: the resolver runs both at build time
// (plugin-docs uniform preset / documan appInit) and at RENDER time in the
// theme layout (vite layout.tsx + the bun render tree run client-side), where
// the page's `metadata.openapi` carries an ABSOLUTE spec path while docs.json
// declares a relative `source`. Matching is therefore pure string work:
// exact equality first, then a normalized suffix match.
// ---------------------------------------------------------------------------

/** Canonical SDK languages — ids/titles/order mirror opensdk-uniform's SDK_LANGS. */
export const API_SDK_LANGUAGES: ReadonlyArray<{ language: APISdkLanguage; title: string }> = [
    { language: "go", title: "Go" },
    { language: "python", title: "Python" },
    { language: "typescript", title: "TypeScript" },
    { language: "ruby", title: "Ruby" },
    { language: "java", title: "Java" },
    { language: "csharp", title: "C#" },
];

/** The raw-HTTP/cURL entry of the language switcher — the DEFAULT view. */
export const API_SDK_HTTP_LANGUAGE = "shell";

export interface ResolvedApiSdkConfig {
    /** Enabled languages, filtered + reordered to the canonical SDK order. */
    languages: APISdkLanguage[];
    /**
     * The switcher's initial language. The raw-HTTP ("shell") view — readers
     * start from the classic REST reference and opt into an SDK language.
     */
    defaultLanguage: string;
}

function isAdvanced(entry: unknown): entry is APIFileAdvanced {
    return !!entry && typeof entry === "object" && typeof (entry as any).source === "string";
}

/** Every entry of an APIFile across all its shapes (string / mixed array / map / advanced). */
function entriesOf(openapi: APIFile | undefined): Array<string | APIFileAdvanced> {
    if (!openapi) return [];
    if (typeof openapi === "string") return [openapi];
    if (Array.isArray(openapi)) return openapi as Array<string | APIFileAdvanced>;
    if (isAdvanced(openapi)) return [openapi];
    // APIFileMap
    return Object.values(openapi as Record<string, string | APIFileAdvanced>);
}

function resolveLanguages(sdk: boolean | APISdkConfig): APISdkLanguage[] {
    const known = API_SDK_LANGUAGES.map(l => l.language);
    if (sdk === true || typeof sdk !== "object" || !Array.isArray(sdk.languages)) {
        return known;
    }
    const wanted = new Set(sdk.languages);
    const filtered = known.filter(l => wanted.has(l));
    return filtered.length ? filtered : known;
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
 * Whether `source` (either the VERBATIM config string — the build-side call
 * sites — or an ABSOLUTE spec path from page metadata) refers to `entry`'s
 * spec. Remote URLs match by exact equality only. For local paths the
 * absolute form matches when it ends with the config source's normalized
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
 * The resolved SDK config for a spec `source` (verbatim config string or
 * absolute path, `#region` already stripped by the caller), or null when the
 * matching entry doesn't enable `sdk` / nothing matches.
 */
export function resolveApiSdkConfig(
    openapi: APIFile | undefined,
    source: string,
): ResolvedApiSdkConfig | null {
    if (!source) return null;
    for (const entry of entriesOf(openapi)) {
        if (!isAdvanced(entry)) continue;
        if (!entry.sdk) continue;
        if (!sourceMatches(entry.source, source)) continue;
        const languages = resolveLanguages(entry.sdk);
        return { languages, defaultLanguage: API_SDK_HTTP_LANGUAGE };
    }
    return null;
}

/** True when ANY openapi entry enables sdk docs (gates the enrichment hook). */
export function anyApiSdkEnabled(openapi: APIFile | undefined): boolean {
    return entriesOf(openapi).some(entry => isAdvanced(entry) && !!entry.sdk);
}
