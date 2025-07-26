import React from "react";
import { createContext, useContext } from "react";

const CoderContext = createContext<{
    lines?: boolean
    scroll?: boolean
}>({
    lines: undefined,
    scroll: undefined,
})


interface CoderProviderProps {
    children: React.ReactNode

    lines?: boolean

    scroll?: boolean
}
export function CoderProvider({ children, lines, scroll }: CoderProviderProps) {
    return <CoderContext.Provider value={{ lines, scroll }}>{children}</CoderContext.Provider>
}

export function useCoder() {
    return useContext(CoderContext)
}