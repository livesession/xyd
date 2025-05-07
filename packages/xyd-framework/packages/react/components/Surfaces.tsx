import React, {createContext, useContext} from 'react'

export enum SurfaceTarget {
    NavRight = "nav.right",
    
    SidebarTop = "sidebar.top"
}

// Type that allows both enum and string values
export type SurfaceTargetType = SurfaceTarget | `${SurfaceTarget}`

interface SurfaceOptions {
    append?: boolean
}

interface ROSurface {
    get(target: SurfaceTargetType): React.JSX.Element | React.JSX.Element[] | undefined
}

interface SurfaceContext {
    surfaces?: ROSurface
}

export const SurfaceContext = createContext<SurfaceContext>({
    surfaces: undefined,
})

// TODO: framework vs theme ?
export class Surfaces implements ROSurface {
    private registry: Partial<Record<SurfaceTargetType, React.JSX.Element | React.JSX.Element[]>> = {}

    public define(target: SurfaceTargetType, component: React.JSX.Element, opts?: SurfaceOptions) {
        if (opts?.append) {
            if (Array.isArray(this.registry[target])) {
                this.registry[target].push(component)
                return
            }

            if (this.registry[target]) {
                this.registry[target] = [this.registry[target], component]
                return
            }

            this.registry[target] = [component]

            return
        }

        this.registry[target] = component
    }

    public get(target: SurfaceTargetType): React.JSX.Element | React.JSX.Element[] | undefined {
        return this.registry[target]
    }
}

export function Surface({target}: { target: SurfaceTargetType }) {
    const registry = useContext(SurfaceContext)

    if (!registry.surfaces) {
        return null
    }

    const components = registry.surfaces.get(target)

    if (!components) {
        return null
    }

    return components
}