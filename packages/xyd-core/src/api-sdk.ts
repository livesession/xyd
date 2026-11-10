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

/** The SDK languages — ids/titles mirror opensdk-uniform's SDK_LANGS; this is the
 * DEFAULT switcher order, used when a config enables every language (`sdk: true`). */
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
    /** Enabled languages, in switcher order: the order of `sdk.languages` when
     * configured (unknown ids dropped, repeats collapsed), else the default order. */
    languages: APISdkLanguage[];
    /**
     * The `sdk.languages` list as configured (unknown ids dropped, repeats
     * collapsed), or undefined when the config enables every language (`sdk:
     * true`, no list, or a list without a known id). For a spec that carries
     * `x-sdk`, the switcher follows this list when present and the spec's own
     * `x-sdk.languages` otherwise — `languages` alone cannot tell the two apart.
     */
    configuredLanguages?: APISdkLanguage[];
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

function resolveLanguages(sdk: boolean | APISdkConfig): Pick<ResolvedApiSdkConfig, "languages" | "configuredLanguages"> {
    const known = API_SDK_LANGUAGES.map(l => l.language);
    if (sdk === true || typeof sdk !== "object" || !Array.isArray(sdk.languages)) {
        return { languages: known };
    }
    // The configured list IS the switcher order (the raw-HTTP "shell" entry stays
    // first regardless): unknown ids drop, a repeated id keeps its first position.
    const ordered: APISdkLanguage[] = [];
    for (const id of sdk.languages) {
        if (known.includes(id) && !ordered.includes(id)) ordered.push(id);
    }
    return ordered.length ? { languages: ordered, configuredLanguages: ordered } : { languages: known };
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
        return { ...resolveLanguages(entry.sdk), defaultLanguage: API_SDK_HTTP_LANGUAGE };
    }
    return null;
}

/** True when ANY openapi entry enables sdk docs (gates the enrichment hook). */
export function anyApiSdkEnabled(openapi: APIFile | undefined): boolean {
    return entriesOf(openapi).some(entry => isAdvanced(entry) && !!entry.sdk);
}
