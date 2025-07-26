import React from "react";

import { WebEditorNavigationItem } from "@xyd-js/core";
import { Nav, UISidebar } from "@xyd-js/ui";

import { FwJsonComponent } from "./FwJsonComponent";

interface WebEditorComponentInner extends WebEditorNavigationItem {
    children?: React.ReactNode
    device?: "mobile" | "desktop" | boolean
}

export function WebEditorComponent(
    Component: React.ComponentType<React.ComponentProps<typeof UISidebar.Item>>,
    componentProps?: Partial<React.ComponentProps<typeof UISidebar.Item>>,
    defaultValue?: string
) {

    return function WebEditorComponentInner(props: WebEditorComponentInner) {
        let dataTags = {}

        if (props.device === "mobile" || (props.mobile && !props.desktop)) {
            dataTags["data-mobile"] = true
        }
        if (props.device === "desktop" || (props.desktop && !props.mobile)) {
            dataTags["data-desktop"] = true
        }

        const content = (
            <Component
                {...componentProps}
                {...dataTags}
            >
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
        )

        // Only wrap in div if dataTags has properties
        return Object.keys(dataTags).length > 0 ? (
            <div {...dataTags}>
                {content}
            </div>
        ) : content
    }
}

WebEditorComponent.SidebarItem = WebEditorComponent(UISidebar.Item, { button: false, ghost: true })
WebEditorComponent.NavItemRaw = WebEditorComponent(Nav.ItemRaw)
WebEditorComponent.SidebarItemButton = WebEditorComponent(UISidebar.Item, { button: true, ghost: true })
