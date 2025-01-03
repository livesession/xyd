import React, {ReactElement} from "react";

export function manualHydration(obj: any, key = 0): ReactElement<any, string | React.JSXElementConstructor<any>> {
    if (typeof obj !== 'object' || obj === null) {
        return React.createElement(React.Fragment, {key});
    }

    const {type, props} = obj || {};
    if (typeof type !== 'string' && typeof type !== 'function') {
        return React.createElement(React.Fragment, {key});
    }

    let children: ReactElement<any, string | React.JSXElementConstructor<any>>[] = [];
    if (props?.children) {
        if (Array.isArray(props.children)) {
            children = props.children.map((child: any, i) => manualHydration(child, key + i)) || [];
        } else {
            children = [manualHydration(props.children, key)];
        }
    }

    const elementProps = {...props, children, key};

    return React.createElement(type, elementProps);
}