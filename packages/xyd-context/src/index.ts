type TransformFn = (metaProps: any, meta: any) => any // TODO: fix any

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
