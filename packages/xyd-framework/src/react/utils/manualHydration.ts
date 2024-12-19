// TODO: !!! THIS SHOULD BE DONE AT DIFFERENT LEVEL !!!
import React from "react";

export function manualHydration(obj: any, key = 0): React.ReactElement | null {
    if (typeof obj !== 'object' || obj === null) {
        return null;
    }

    const {type, props} = obj || {};
    if (typeof type !== 'string' && typeof type !== 'function') {
        return null;
    }

    let children = []
    if (props?.children?.map && typeof props?.children?.map === "function") {
        children = props?.children?.map((child: any, i) => manualHydration(child, key + i)) || []
    }

    return React.createElement(type, {...props, children, key});
}
