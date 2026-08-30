import React from "react";

import { useComponents } from "../contexts";

/**
 * Renders a custom sidebar-item component referenced by path in `docs.json`
 * (`{ component: "./path", props? }`). The path is resolved through the
 * user-components registry (keyed by the path string; `appInit` bundles the file
 * via `virtual:xyd-user-components`). Rendered inside the framework context, so
 * the component may use `@xyd-js/framework/react` hooks.
 */
export function FwSidebarComponent({ component, props }: { component: string; props?: Record<string, any> }) {
    const components = useComponents() as Record<string, React.ComponentType<any>> | undefined;
    const Comp = components?.[component];

    if (!Comp) {
        if (typeof console !== "undefined") {
            console.warn(`[xyd] sidebar component not found: "${component}"`);
        }
        return null;
    }

    return <Comp {...(props || {})} />;
}
