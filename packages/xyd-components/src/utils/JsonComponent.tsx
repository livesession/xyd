import React from "react";

import * as Components from "../writer";

export type JsonComponentProps = {
    component: string
    props: Record<string, any>
} | string

export function JsonComponent(args: JsonComponentProps) {
    if (typeof args === "string") {
        return args
    }

    const { component, props: { children, ...props } = {} } = args

    if (!component) {
        return null
    }

    let Component: React.ComponentType<any> | undefined = Components[component as keyof typeof Components];

    if (Component) {
        return <Component {...props}>
            {children}
        </Component>
    }

    Component = component

    return <Component {...props} >
        {children}
    </Component>
}

