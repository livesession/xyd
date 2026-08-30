import React from "react"

import { useActiveLogoTrailingItem } from "@xyd-js/framework/react"

// Custom segment PANEL component (referenced from docs.json's logoTrailing
// segment). Proves a segment `component` renders as the dropdown panel and can
// use framework hooks.
export default function TestSegmentPanel() {
    const product = useActiveLogoTrailingItem()
    return (
        <div part="segment-panel" data-product={product?.title || ""}>
            <a href="/nomad/docs/what-is-nomad">Nomad docs</a>
            <a href="/consul/docs/what-is-consul">Consul docs</a>
        </div>
    )
}
