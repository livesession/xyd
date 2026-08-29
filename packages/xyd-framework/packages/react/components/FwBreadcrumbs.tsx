import React from "react";

import { Breadcrumbs } from "@xyd-js/components/writer";

import { useBreadcrumbs, useAppearance } from "../contexts";
import { displayBreadcrumbs } from "../utils";
import { FwLink } from "./FwLink";

export function FwBreadcrumbs() {
    const fwBreadcrumbs = useBreadcrumbs()
    const appearance = useAppearance()

    // `content.breadcrumbs` is `boolean | { links?, rootLevel? }` (both default true):
    // links:false → plain text; rootLevel:false → drop the top tab/route crumb.
    const breadcrumbs = displayBreadcrumbs(
        (fwBreadcrumbs as any) || [],
        appearance?.content?.breadcrumbs,
    )

    return <Breadcrumbs
        items={breadcrumbs}
        as={FwLink}
    />
}
