import { createContext, useContext } from "react";

import { type Theme } from "@code-hike/lighter";

export const AtlasContext = createContext<{
    syntaxHighlight: Theme | null
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
