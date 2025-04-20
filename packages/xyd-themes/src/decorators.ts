
import type { RootContent } from "mdast";

import { registerMetaComponent } from "@xyd-js/context";

export function metaComponent<P, V>(
    name: string,
    componentName?: string
) {
    return function (target: (
        props: P,
        vars: V,
        treeChilds: readonly RootContent[]
    ) => any, context: ClassMethodDecoratorContext) {
        registerMetaComponent(
            name,
            componentName || name,
            target
        );

        return function (this: any, ...args: any[]) {
            return target.apply(this, args);
        };
    };
}

