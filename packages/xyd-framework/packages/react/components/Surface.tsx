import React, { createContext, useContext } from "react";

export interface SurfaceRegistry {
    [target: string]: () => React.ReactNode;
}

export const SurfaceContext = createContext<SurfaceRegistry>({})

export function Surface({ target }: { target: string }) {
    const registry = useContext(SurfaceContext)

    const Component = registry[target]

    if (!Component) {
        return null
    }

    return <Component />
}