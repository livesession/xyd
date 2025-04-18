import { registerMetaComponent } from "@xyd-js/context";


export function metaComponent<P, M>(
    name: string,
    componentName?: string
) {
    return function (target: (props: P, meta: M) => any, context: ClassMethodDecoratorContext) {
        registerMetaComponent(
            name,
            componentName || name,
            target
        );

        return function (this: any, ...args: any[]) {
            console.log("this", this.abcd)
            return target.apply(this, args);
        };
    };
}

