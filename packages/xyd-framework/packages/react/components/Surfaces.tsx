import React, {createContext, useContext, ComponentType} from 'react'

export enum SurfaceTarget {
    NavRight = "nav.right",
    
    SidebarTop = "sidebar.top",

    PageFooterBottom = "page.footer.bottom",

    SidebarItemLeft = "sidebar.item.left",
    SidebarItemRight = "sidebar.item.right",
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

    public define(
        target: SurfaceTargetType,
        component: React.JSX.Element | React.ComponentType<any>, // TODO: fix any
        opts?: SurfaceOptions
    ) {
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

interface SurfaceProps {
    target: SurfaceTargetType
    props?: any // TODO: fix any
}

export function Surface(props: SurfaceProps): React.JSX.Element | null {
    const { target } = props

    const registry = useContext(SurfaceContext)

    if (!registry.surfaces) {
        return null
    }

    const components = registry.surfaces.get(target)

    if (!components) {
        return null
    }

    if (!Array.isArray(components)) {
        if (typeof components === 'function') {
            const Component = components as ComponentType<any>
            return <Component {...props.props} />
        }

        return <React.Fragment>{components}</React.Fragment>
    }

    if (!components.length) {
        return null
    }

    return <>
        {components.map((Component, index) => {
            if (typeof Component === 'function') {
                const Comp = Component as ComponentType<any>
                return <Comp key={index} {...props.props} />
            }
            return <React.Fragment key={index}>{Component}</React.Fragment>
        })}
    </>
}