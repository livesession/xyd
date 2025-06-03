import type { RootContent } from 'mdast'

import type { Theme } from '@xyd-js/core'

type TransformFn = (
    themeSettings: Theme,
    metaProps: any, 
    meta: any,
    treeChilds: readonly RootContent[]
) => any // TODO: fix any

interface MetaComponent {
    name: string
    
    componentName: string

    transform: TransformFn
}

const registry = new Map<string, MetaComponent>()

export function registerMetaComponent(
    name: string,
    componentName: string,
    transform: TransformFn
) {
    registry.set(name, {
        name,
        componentName,
        transform
    })
}

export function getMetaComponent(name: string) {
    return registry.get(name)
}
