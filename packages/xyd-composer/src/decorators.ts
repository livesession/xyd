import { registerMetaComponent } from "@xyd-js/context";

export function metaComponent<P, V>(
    name: string,
    componentName?: string
) {
    return function (
        target: any,
        context: any
    ) {
        registerMetaComponent(
            name,
            componentName || name,
            target
        );
    };
}

