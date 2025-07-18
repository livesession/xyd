import React from "react"

import { useSettings } from "../contexts"
import { WebEditorComponent } from "./WebEditorComponent"
import { WebEditorNavigationItem } from "@xyd-js/core"

export function FwWebEditorSidebarTop() {
    const settings = useSettings()

    const webEditorSidebarTop = settings?.webeditor?.sidebarTop?.map((props, index) => {
        if (props.component) {
            return <WebEditorComponent.SidebarItemButton
                key={keyId(props, index)}
                {...props}
            />
        }

        return <WebEditorComponent.SidebarItem
            key={keyId(props, index)}
            {...props}
        />
    })

    return webEditorSidebarTop
}

function keyId(props: WebEditorNavigationItem, index: number) {
    return `${props?.component || "."}-${props?.title || props?.href || "."}-${index}`
}