import React from "react";

import type {ITOC} from "@xyd-js/ui";
import {Toc} from "@xyd-js/ui";

import {useMetadata, useSettings, useToC} from "../contexts";

export function FwToc() {
    const metadata = useMetadata()
    const settings = useSettings()
    const toc = useToC()

    if (!toc) {
        return null
    }

    const maxDepth = metadata?.maxTocDepth || settings?.theme?.writer?.maxTocDepth || 2

    const renderTocItems = (items: Readonly<ITOC[]>, uiDepth = 0) => {
        return items.map((item) => (
            <React.Fragment key={item.id}>
                <Toc.Item
                    id={item.id}
                    depth={uiDepth}
                >
                    {item.value}
                </Toc.Item>
                {item.children && item.children.length > 0 && renderTocItems(item.children, uiDepth + 1)}
            </React.Fragment>
        ))
    }

    // TODO: maxDepth for specific `#heading`
    return <Toc maxDepth={maxDepth}>
        {renderTocItems(toc)}
    </Toc>
}