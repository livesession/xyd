import React, { createContext } from 'react'

export enum SurfaceTarget {
    NavRight = "nav.right",

    SidebarTop = "sidebar.top",

    PageFooterBottom = "page.footer.bottom",

    SidebarItemLeft = "sidebar.item.left",
    SidebarItemRight = "sidebar.item.right",
}

// Type that allows both enum and string values
export type SurfaceTargetType = SurfaceTarget | `${SurfaceTarget}`

export interface SurfaceOptions {
    append?: boolean
}

export interface ROSurface {
    get(target: SurfaceTargetType): React.JSX.Element | React.JSX.Element[] | undefined
}

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
