import { createContext, createElement, useCallback, useContext, useState, type ReactNode } from "react";

import { type Theme } from "@code-hike/lighter";
import { SDK_LANGUAGE_STORAGE_KEY, useSdkLanguageStore } from "@xyd-js/components/coder";

export interface VariantToggleConfig {
    key: string;
    defaultValue: string;
}

export interface AtlasSdkTypesConfig {
    /** SDK-native mode: the definitions render the SDK request/response TYPES
     * (per language) in place of the REST params, and the operation header shows
     * the SDK method signature instead of the URL. */
    enabled: boolean;
    /** The SDK languages, in switcher order (`{ language, title }`). */
    languages: { language: string; title: string }[];
    /** The initial language (default: the first). */
    defaultLanguage?: string;
}

export interface AtlasCodeSampleConfig {
    /** Render the code samples' language switcher as a dropdown to pick the
     * language, instead of the default row of tabs. */
    languageSwitcher?: "tabs" | "dropdown";
    /** Render each language as its programming-language icon (from xyd's
     * built-in icon set) instead of the raw name (a Go logo, not "golang"). */
    languageIcons?: boolean;
    /** Advanced override: fully control a language label. Takes precedence over
     * `languageIcons`. */
    renderLanguage?: (lang: string, meta?: string) => ReactNode;
}

export interface AtlasPlaygroundConfig {
    /** Called when the user clicks "Run request" on a REST operation — the host
     * opens its API playground (e.g. a modal mounting the apiatlas widget), seeded
     * from the clicked `reference`. Opt-in: no button renders unless provided, so
     * pure-docs Atlas is unaffected. */
    // biome-ignore lint/suspicious/noExplicitAny: uniform Reference (loosely typed here, matching `Link`)
    onTry: (reference: any) => void;
}

export const AtlasContext = createContext<{
    syntaxHighlight: Theme | null,
    markdownFormat?: boolean,
    baseMatch?: string,
    variantToggles?: VariantToggleConfig[], // Array of toggle configurations
    codeSample?: AtlasCodeSampleConfig,
    sdkTypes?: AtlasSdkTypesConfig,
    playground?: AtlasPlaygroundConfig,
    Link?: any
}>({
    syntaxHighlight: null,
    markdownFormat: false
})

/** The page-shared SDK language selection — one value drives the header
 * signature, the request/response type variants, and the code examples together
 * (so the whole operation reads "in Go"). Mounted ABOVE the Atlas rows so every
 * operation switches at once. */
const SdkLanguageContext = createContext<{
    language: string;
    setLanguage: (lang: string) => void;
} | null>(null)

export function SdkLanguageProvider({ defaultLanguage, storageKey, languages, children }: {
    defaultLanguage?: string,
    /** When set, the choice lives in the page-wide language store under this
     * localStorage key (`xyd:sdk-language` is the site-wide one): it sticks
     * across reloads / operations, `?lang=<id>` in the URL seeds it, every
     * change is mirrored back to the URL, and the markdown code groups of
     * different languages follow it. Omit for a local, unpersisted choice
     * (a standalone Atlas). */
    storageKey?: string,
    /** Allow-list for the STORED value: a persisted language not in this list
     * (config changed / another page's pick / an unknown `?lang=`) is ignored
     * and the default shows. Omit to accept any stored value. */
    languages?: string[],
    children: ReactNode
}) {
    const fallback = defaultLanguage || "go"
    const persisted = !!storageKey
    const [local, setLocal] = useState(fallback)
    // The server reads null → the default renders; the client swaps in the
    // stored language after hydration (an external store, no mismatch).
    const [stored, setStored] = useSdkLanguageStore(storageKey ?? SDK_LANGUAGE_STORAGE_KEY)
    const allowed = !!stored && (!languages || languages.includes(stored))
    const language = persisted ? (allowed ? (stored as string) : fallback) : local

    const setLanguage = useCallback((lang: string) => {
        if (persisted) setStored(lang)
        else setLocal(lang)
    }, [persisted, setStored])

    return createElement(SdkLanguageContext.Provider, { value: { language, setLanguage } }, children)
}

/** The shared SDK language `[language, setLanguage]`, or null outside a provider. */
export function useSdkLanguage() {
    return useContext(SdkLanguageContext)
}

export function useSdkTypes() {
    return useContext(AtlasContext).sdkTypes
}

/** The host's API-playground config, or undefined (no "Run request" button). */
export function usePlayground() {
    return useContext(AtlasContext).playground
}

export function useSyntaxHighlight() {
    const context = useContext(AtlasContext)

    if (!context) {
        throw new Error("useSyntaxHighlight must be used within a AtlasContext")
    }

    return context.syntaxHighlight
}

export function useBaseMatch() {
    const context = useContext(AtlasContext)

    if (!context) {
        throw new Error("useBaseMatch must be used within a AtlasContext")
    }

    return context.baseMatch
}

export function useVariantToggles() {
    const context = useContext(AtlasContext)

    if (!context) {
        throw new Error("useVariantToggles must be used within a AtlasContext")
    }

    return context.variantToggles || []
}