import React from "react"

import { Badge } from "@xyd-js/components/writer"

export function SidebarItemRight(props: any) {
    const openapi = props?.pageMeta?.openapi || ""
    const [_, region = ""] = openapi.includes("#") ? openapi.split("#") : ["", openapi]
    const [method = ""] = region.split(" ")

    if (!method) {
        return null
    }
    if (method.includes("components/schemas")) {
        return null
    }

    let methodText = method.toUpperCase()
    if (method === "DELETE") {
        methodText = "DEL"
    }

    return <div data-active={props?.active ? "true" : undefined} atlas-oas-method={method}>
        <Badge size="xs">
            {methodText}
        </Badge>
    </div>
}