import React from "react";

import { WebEditorNavigationItem } from "@xyd-js/core";
import { UISidebar } from "@xyd-js/ui";

import { FwJsonComponent } from "./FwJsonComponent";

interface WebEditorComponentInner extends WebEditorNavigationItem {
    children?: React.ReactNode
}

export function WebEditorComponent(
    Component: React.ComponentType<React.ComponentProps<typeof UISidebar.Item>>,
    componentProps: Partial<React.ComponentProps<typeof UISidebar.Item>>,
    defaultValue?: string
) {
    return function WebEditorComponentInner(props: WebEditorComponentInner) {
        return <span
            data-mobile={props.mobile}
            data-desktop={props.desktop}
            key={props.title + props.page + props.href + props.component}
        >
            <Component {...componentProps}>
                {
                    props.component ? <FwJsonComponent
                        component={props.component || ""}
                        props={{
                            ...props.props,
                            children: props.props?.children,
                        }}
                    /> : defaultValue
                }
                {props.children}
            </Component>
        </span>
    }
}

WebEditorComponent.SidebarItem = WebEditorComponent(UISidebar.Item, { button: false, ghost: true })

