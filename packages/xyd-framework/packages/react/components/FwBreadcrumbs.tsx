import React from "react";

import {Breadcrumbs} from "@xyd-js/components/writer";

import {useBreadcrumbs} from "../contexts";

export function FwBreadcrumbs() {
    const fwBreadcrumbs = useBreadcrumbs()

    const breadcrumbs = fwBreadcrumbs?.map(item => ({
        title: item.title,
        href: item.href
    }))

    return <Breadcrumbs
        items={breadcrumbs || []}
    />
}
