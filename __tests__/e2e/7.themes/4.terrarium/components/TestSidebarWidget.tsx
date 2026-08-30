import React from "react"

import { useActiveLogoTrailingItem } from "@xyd-js/framework/react"

// Custom sidebar-item component (referenced from docs.json). Uses a framework
// hook to prove hooks work inside sidebar components.
export default function TestSidebarWidget(props: { label?: string }) {
    const product = useActiveLogoTrailingItem()
    return <div part="test-widget" data-product={product?.title || ""}>
        {props.label || "Widget"}
    </div>
}
