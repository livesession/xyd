import React from "react"

import { useSettings } from "../contexts"
import { WebEditorComponent } from "./WebEditorComponent"

export function FwWebEditorSidebarTop() {
    const settings = useSettings()

    const webEditorSidebarTop = settings?.webeditor?.sidebarTop?.map(WebEditorComponent.SidebarItem)

    return webEditorSidebarTop
}