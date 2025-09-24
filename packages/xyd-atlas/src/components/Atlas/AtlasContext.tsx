import { createContext, useContext } from "react";

import { type Theme } from "@code-hike/lighter";

export interface VariantToggleConfig {
    key: string;
    defaultValue: string;
}

export const AtlasContext = createContext<{
    syntaxHighlight: Theme | null,
    markdownFormat?: boolean,
    baseMatch?: string,
    variantToggles?: VariantToggleConfig[], // Array of toggle configurations
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