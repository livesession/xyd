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
        let dataTags = {}

        if (props.mobile && !props.desktop) {
            dataTags["data-mobile"] = true
        }
        if (props.desktop && !props.mobile) {
            dataTags["data-desktop"] = true
        }

        return <div
            {...dataTags}
            key={props.title + props.page + props.href + props.component}
        >
            <Component 
            {...componentProps} 
            {...dataTags}
            key={props.title + props.page + props.href + props.component}
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
        </div>
    }
}

WebEditorComponent.SidebarItem = WebEditorComponent(UISidebar.Item, { button: false, ghost: true })

