import React from "react";

import { ComponentLike } from "@xyd-js/core";

import * as WriterComponents from "@xyd-js/components/writer";
import * as CoderComponents from "@xyd-js/components/coder";
import * as SystemComponents from "@xyd-js/components/system";

import { useComponents } from "../contexts";

export function FwJsonComponent(args: ComponentLike) {
    const components = useJsonComponents()

    if (!args) {
        return null
    }

    if (React.isValidElement(args)) {
        return args
    }

    // todo: better mechanism?
    if (typeof args === "string") {
        return args
    }

    if (!args || typeof args !== "object") {
        return null
    }

    if (!("component" in args)) {
        return null
    }

    const { component, props: { children, ...props } = {} } = args

    if (!component) {
        return null
    }

    let Component = resolveComponent(component, components)

    if (Component) {
        return <Component {...props}>
            {renderChildren(children)}
        </Component>
    }

    // Fallback: try to use component as a direct React component
    Component = component

    return <Component {...props} >
        {renderChildren(children)}
    </Component>
}

function useJsonComponents() {
    const customComponents = useComponents()

    // Merge components and detect conflicts in one reduce chain
    return [
        WriterComponents,
        CoderComponents,
        SystemComponents,
        customComponents || {}
    ].reduce((components, componentSet) => {
        Object.entries(componentSet).forEach(([name, component]) => {
            // Check if component already exists and log error
            if (name in components) {
                console.error(`Component name conflict detected: ${name}`)
            }

            // Merge components
            components[name] = component
        })
        return components
    }, {} as Record<string, any>)
}

// Helper function to recursively render children
function renderChildren(children: any): React.ReactNode {
    if (!children) {
        return null
    }

    // Handle arrays
    if (Array.isArray(children)) {
        return children.map((child, index) => (
            <FwJsonComponent key={index} {...child} />
        ))
    }

    // Handle component objects
    if (typeof children === "object" && children !== null && "component" in children) {
        return <FwJsonComponent {...children} />
    }

    // Handle strings and other primitive values
    return children
}

// Helper function to resolve nested component paths like "Button.Primary"
function resolveComponent(componentName: string, components: Record<string, any>): any {
    if (!componentName || typeof componentName !== "string") {
        return null
    }

    // Handle dot notation for nested components
    if (componentName.includes(".")) {
        const parts = componentName.split(".")
        let current = components

        for (const part of parts) {
            if (current && typeof current === "object" && part in current) {
                current = current[part]
            } else {
                return null
            }
        }

        return current
    }

    // Handle direct component lookup
    return components[componentName] || null
}
