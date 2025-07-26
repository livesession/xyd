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

    // if (Component && Component.name === "FwLogo" || Component.name === "a") {
    //     console.log(props, 3333, Component.name);
    //     return <Component {...props}>
    //         {renderChildren(children)}
    //     </Component>
    // }

    // if (Component) {
    //     console.log(Component, 33333, Component.name);
    // }

    if (Component) {
        // console.log(props, 3333, Component.name);
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

    // Track component sources to handle conflicts properly
    const componentSources = new Map<string, string>()
    const components: Record<string, any> = {}

    // Process each component set
    const componentSets = [
        {
            group: "Writer",
            components: WriterComponents
        },
        {
            group: "Coder",
            components: CoderComponents
        },
        {
            group: "System",
            components: SystemComponents
        },
        {
            group: "Custom",
            components: customComponents || {}
        }
    ]

    componentSets.forEach(componentSet => {
        Object.entries(componentSet.components).forEach(([name, component]) => {
            // Validate component name starts with capital letter
            if (name.charAt(0) !== name.charAt(0).toUpperCase()) {
                return
            }

            // Validate component is a function
            if (typeof component !== 'function') {
                return
            }

            if (name in components) {
                // Conflict detected - both components need to be renamed with their group prefixes
                const existingComponent = components[name]
                const existingGroup = componentSources.get(name) || "Custom"
                
                // Remove the existing component and add it back with group prefix
                delete components[name]
                components[`${existingGroup}.${name}`] = existingComponent
                
                // Add the new component with its group prefix
                components[`${componentSet.group}.${name}`] = component
                
                console.debug(`Component name conflict resolved: ${name} -> ${existingGroup}.${name} and ${componentSet.group}.${name}`)
            } else {
                // No conflict, add the component normally
                components[name] = component
                componentSources.set(name, componentSet.group)
            }
        })
    })

    return components
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
