import React, { createContext, useContext, ComponentType } from 'react'

import { ROSurface, SurfaceTargetType } from '../../../src'


interface SurfaceContext {
    surfaces?: ROSurface
}

export const SurfaceContext = createContext<SurfaceContext>({
    surfaces: undefined,
})

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