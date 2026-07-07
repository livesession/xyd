import { createContext, useContext, type ReactNode } from "react";

import { type Theme } from "@code-hike/lighter";

export interface VariantToggleConfig {
    key: string;
    defaultValue: string;
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

export const AtlasContext = createContext<{
    syntaxHighlight: Theme | null,
    markdownFormat?: boolean,
    baseMatch?: string,
    variantToggles?: VariantToggleConfig[], // Array of toggle configurations
    codeSample?: AtlasCodeSampleConfig,
    Link?: any
}>({
    syntaxHighlight: null,
    markdownFormat: false
})

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