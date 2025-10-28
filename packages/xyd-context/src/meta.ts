import type { RootContent } from 'mdast'

import type { Metadata, Theme } from '@xyd-js/core'

type TransformFn = (
    themeSettings: Theme,
    metaProps: any, 
    outputVars: any,
    treeChilds: readonly RootContent[],
    meta: Metadata<any>
) => any // TODO: fix any

interface MetaComponent {
    name: string
    
    componentName: string

    transform: TransformFn
}

// TODO: in the future fix package resolution instead of globalThis

declare global {
    var __xydCtxMetaRegistry: Map<string, MetaComponent>
}

if (typeof globalThis.__xydCtxMetaRegistry === 'undefined') {
    globalThis.__xydCtxMetaRegistry = new Map<string, MetaComponent>()
}

export function registerMetaComponent(
    name: string,
    componentName: string,
    transform: TransformFn
) {
    globalThis.__xydCtxMetaRegistry.set(name, {
        name,
        componentName,
        transform
    })
}

export function getMetaComponent(name: string) {
    return globalThis.__xydCtxMetaRegistry.get(name)
}
