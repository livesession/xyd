import { createContext, useContext } from "react";

import { type Theme } from "@code-hike/lighter";

export interface VariantToggleConfig {
    key: string;
    defaultValue: string;
}

export const AtlasContext = createContext<{
    syntaxHighlight: Theme | null,
    baseMatch?: string,
    variantToggles?: VariantToggleConfig[], // Array of toggle configurations
}>({
    syntaxHighlight: null
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