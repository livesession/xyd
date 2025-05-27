import { createContext, useContext } from "react";

import { type Theme } from "@code-hike/lighter";

/*
const variantToggleKey = "status"
const defaultVariantValue = "200"
 */
export const AtlasContext = createContext<{
    syntaxHighlight: Theme | null,
    baseMatch?: string,
    variantToggleKey?: string, // TODO: BETTER API
    defaultVariantValue?: string // TODO: BETTER API
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

export function useVariantToggleKey() {
    const context = useContext(AtlasContext)

    if (!context) {
        throw new Error("useVariantToggleKey must be used within a AtlasContext")
    }

    return context.variantToggleKey
}
export function useDefaultVariantValue() {
    const context = useContext(AtlasContext)

    if (!context) {
        throw new Error("useDefaultVariantValue must be used within a AtlasContext")
    }

    return context.defaultVariantValue
}